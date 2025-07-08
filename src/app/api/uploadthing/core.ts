import { createUploadthing, type FileRouter } from 'uploadthing/next';

const f = createUploadthing();

export const uploadRouter = {
	ipaUploader: f({
		blob: {
			maxFileSize: '1GB',
			maxFileCount: 1,
		},
	})
		.middleware(({ files }) => {
			for (const file of files) {
				const fileName = file.name.toLowerCase();
				if (
					!(
						fileName.endsWith('.ipa') ||
						fileName.endsWith('.app.zip')
					)
				) {
					throw new Error('Only .ipa and .app files are allowed');
				}
			}
			return {};
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
