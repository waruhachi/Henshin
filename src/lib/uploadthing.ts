import type { UploadRouter } from '@/app/api/upload/core';

import {
	generateUploadButton,
	generateUploadDropzone,
} from '@uploadthing/react';

export const UploadButton = generateUploadButton<UploadRouter>();
export const UploadDropzone = generateUploadDropzone<UploadRouter>();
