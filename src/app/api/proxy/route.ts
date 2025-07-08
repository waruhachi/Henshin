import { type NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const imageUrl = searchParams.get('url');

	if (!imageUrl) {
		return new NextResponse('Image URL is required', { status: 400 });
	}

	try {
		const url = new URL(imageUrl);
		const allowedDomains = [
			'is1-ssl.mzstatic.com',
			'is2-ssl.mzstatic.com',
			'is3-ssl.mzstatic.com',
			'is4-ssl.mzstatic.com',
			'is5-ssl.mzstatic.com',
		];

		if (!allowedDomains.includes(url.hostname)) {
			return new NextResponse('Domain not allowed', { status: 403 });
		}

		const response = await fetch(imageUrl, {
			headers: {
				'User-Agent': 'Mozilla/5.0 (compatible; Next.js Image Proxy)',
			},
		});

		if (!response.ok) {
			return new NextResponse(
				`Failed to fetch image: ${response.status}`,
				{
					status: response.status,
				}
			);
		}

		const contentType = response.headers.get('content-type');

		if (!contentType?.startsWith('image/')) {
			return new NextResponse('Response is not an image', {
				status: 400,
			});
		}

		const imageBuffer = await response.arrayBuffer();

		return new NextResponse(imageBuffer, {
			headers: {
				'Content-Type': contentType,
				'Cache-Control': 'public, max-age=86400, s-maxage=86400',
				'Content-Length': imageBuffer.byteLength.toString(),
			},
		});
	} catch {
		return new NextResponse('Internal server error', { status: 500 });
	}
}
