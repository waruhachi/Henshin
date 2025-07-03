import { createUploadthing, type FileRouter } from 'uploadthing/next';

const f = createUploadthing();

export const uploadRouter = {
	ipaUploader: f({
		'application/octet-stream': {
			maxFileSize: '1GB',
			maxFileCount: 1,
		},
	})
		.onUploadError((data) => {
			// biome-ignore lint/suspicious/noConsole: <debug>
			console.error('error', data);
		})
		.onUploadComplete((data) => {
			// biome-ignore lint/suspicious/noConsole: <debug>
			console.log('file', data);
		}),
} satisfies FileRouter;

export type UploadRouter = typeof uploadRouter;
