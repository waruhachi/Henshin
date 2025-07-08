import { type NextRequest, NextResponse } from 'next/server';
import { UTApi } from 'uploadthing/server';

const utapi = new UTApi();

export async function POST(request: NextRequest) {
	try {
		const { fileKey } = await request.json();

		if (!fileKey) {
			return NextResponse.json(
				{ error: 'File key is required' },
				{ status: 400 }
			);
		}

		await utapi.deleteFiles(fileKey);

		return NextResponse.json({ success: true });
	} catch {
		return NextResponse.json(
			{ error: 'Failed to delete file' },
			{ status: 500 }
		);
	}
}
