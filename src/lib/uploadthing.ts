import type { UploadRouter } from '@/app/api/uploadthing/core';

import {
	generateReactHelpers,
	generateUploadButton,
	generateUploadDropzone,
} from '@uploadthing/react';

export const UploadButton = generateUploadButton<UploadRouter>();
export const UploadDropzone = generateUploadDropzone<UploadRouter>();

export const { useUploadThing } = generateReactHelpers<UploadRouter>();
