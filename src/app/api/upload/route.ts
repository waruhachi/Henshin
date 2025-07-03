// import type { NextRequest } from 'next/server';

// import { type HandleUploadBody, handleUpload } from '@vercel/blob/client';
// import { NextResponse } from 'next/server';

// export async function POST(request: NextRequest): Promise<NextResponse> {
// 	const body = (await request.json()) as HandleUploadBody;

// 	try {
// 		const jsonResponse = await handleUpload({
// 			body,
// 			request,
// 			onBeforeGenerateToken: () => {
// 				return Promise.resolve({
// 					allowedContentTypes: ['application/octet-stream'],
// 					addRandomSuffix: false,
// 					allowOverwrite: true,
// 					tokenPayload: JSON.stringify({
// 						uploadedAt: new Date().toISOString(),
// 					}),
// 				});
// 			},
// 			onUploadCompleted: ({ blob, tokenPayload }) => {
// 				// biome-ignore lint/suspicious/noConsole: <debug>
// 				console.log('blob upload completed', blob, tokenPayload);
// 				return Promise.resolve();
// 			},
// 		});

// 		return NextResponse.json(jsonResponse);
// 	} catch (error) {
// 		return NextResponse.json(
// 			{ error: (error as Error).message },
// 			{ status: 400 }
// 		);
// 	}
// }

import { createRouteHandler } from 'uploadthing/next';

import { uploadRouter } from './core';

export const { GET, POST } = createRouteHandler({
	router: uploadRouter,
});
