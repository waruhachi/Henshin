import type { AppStoreMetadata } from '@/types/global';

import { type NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const appName = searchParams.get('appName');

	if (!appName) {
		return new Response('App name is required', { status: 400 });
	}

	const response = await fetch(
		`https://itunes.apple.com/search?term=${encodeURIComponent(
			appName
		)}&entity=software&limit=1`
	);

	if (!response.ok) {
		return new Response('Failed to fetch metadata from iTunes', {
			status: 500,
		});
	}

	const data: {
		resultCount: number;
		results: Record<string, unknown>[];
	} = await response.json();

	if (data.resultCount === 0 || !data.results?.length) {
		return new Response('App not found', { status: 404 });
	}

	const result = data.results[0] as AppStoreMetadata;

	const metadata = {
		icon:
			(result.artworkUrl512 as string | undefined) ??
			(result.artworkUrl100 as string | undefined) ??
			'',
		developer: (result.artistName as string | undefined) ?? '',
		price: (result.formattedPrice as string | undefined) ?? '',
		fileSize: result.fileSizeBytes ? Number(result.fileSizeBytes) : 0,
		rating: (result.averageUserRating as number | undefined) ?? 0,
		description: (result.description as string | undefined) ?? '',
		genre: (result.primaryGenreName as string | undefined) ?? '',
	};

	return NextResponse.json(metadata);
}
