'use client';

import type { PutBlobResult } from '@vercel/blob';
import type { AppMetadata } from '@/types/global';

import { upload } from '@vercel/blob/client';
import { File, X } from 'lucide-react';
import Image from 'next/image';
import { type ChangeEvent, type DragEvent, useRef, useState } from 'react';
import { toast } from 'sonner';

import { getMetadata } from '@/app/actions/metadata';
import { BorderBeam } from '@/components/ui/border-beam';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Rating, RatingButton } from '@/components/ui/rating';

export default function FileUpload() {
	const [uploadState, setUploadState] = useState<{
		file: File | null;
		progress: number;
		uploading: boolean;
		metadata: AppMetadata | null;
		fetchingMetadata: boolean;
		uploaded: boolean;
	}>({
		file: null,
		progress: 0,
		uploading: false,
		metadata: null,
		fetchingMetadata: false,
		uploaded: false,
	});
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [_, setBlob] = useState<PutBlobResult | null>(null);

	const validFileExtensions = ['ipa', 'app'];

	const handleFile = async (selectedFile: File | undefined) => {
		if (!selectedFile) {
			return;
		}

		const fileExt = selectedFile.name.split('.').pop()?.toLowerCase() ?? '';
		if (validFileExtensions.includes(fileExt)) {
			setUploadState({
				file: selectedFile,
				progress: 0,
				uploading: false,
				metadata: null,
				fetchingMetadata: true,
				uploaded: false,
			});

			try {
				const formData = new FormData();
				formData.append('ipa', selectedFile);
				const appMetadata = await getMetadata(formData);

				setUploadState((prev) => ({
					...prev,
					metadata: appMetadata,
					fetchingMetadata: false,
				}));
			} catch {
				toast.error('Failed to fetch app metadata', {
					position: 'bottom-right',
					duration: 3000,
				});
				setUploadState((prev) => ({
					...prev,
					fetchingMetadata: false,
				}));
			}
		} else {
			toast.error('Please upload a IPA or APP file.', {
				position: 'bottom-right',
				duration: 3000,
			});
		}
	};

	const uploadFile = async () => {
		if (!uploadState.file) {
			return;
		}

		setUploadState((prev) => ({
			...prev,
			uploading: true,
			progress: 0,
		}));

		try {
			const newBlob = await upload(
				uploadState.file.name,
				uploadState.file,
				{
					access: 'public',
					handleUploadUrl: '/api/upload',
					onUploadProgress: ({ percentage }) => {
						setUploadState((prev) => ({
							...prev,
							progress: percentage,
						}));
					},
				}
			);

			setBlob(newBlob);
			setUploadState((prev) => ({
				...prev,
				uploading: false,
				uploaded: true,
				progress: 100,
			}));

			toast.success('File uploaded successfully!', {
				position: 'bottom-right',
				duration: 3000,
			});
		} catch (error) {
			toast.error(
				`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`,
				{
					position: 'bottom-right',
					duration: 3000,
				}
			);
			setUploadState((prev) => ({
				...prev,
				uploading: false,
				progress: 0,
			}));
		}
	};

	const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
		handleFile(event.target.files?.[0]);
	};

	const handleDrop = (event: DragEvent<HTMLButtonElement>) => {
		event.preventDefault();
		handleFile(event.dataTransfer.files?.[0]);
	};

	const resetFile = () => {
		setUploadState({
			file: null,
			progress: 0,
			uploading: false,
			metadata: null,
			fetchingMetadata: false,
			uploaded: false,
		});
		if (fileInputRef.current) {
			fileInputRef.current.value = '';
		}
	};

	const formatFileSize = (bytes: number) => {
		if (bytes === 0) {
			return '0 Bytes';
		}
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return `${Number.parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
	};

	const { file, progress, uploading, metadata, fetchingMetadata, uploaded } =
		uploadState;

	const getUploadButtonText = () => {
		if (uploaded) {
			return 'Uploaded';
		}
		if (uploading) {
			return 'Uploading...';
		}
		return 'Upload';
	};

	return (
		<div className="relative flex w-full max-w-lg items-center justify-center rounded-lg bg-card p-10">
			<BorderBeam delay={0} duration={15} size={300} />
			<form className="w-full" onSubmit={(e) => e.preventDefault()}>
				<input
					accept=".ipa,.app"
					className="sr-only"
					id="upload"
					name="upload"
					onChange={handleFileChange}
					ref={fileInputRef}
					type="file"
				/>
				<button
					className="mt-2 flex w-full justify-center rounded-md border border-input border-dashed px-6 py-12"
					onClick={() => fileInputRef.current?.click()}
					onDragOver={(e) => e.preventDefault()}
					onDrop={handleDrop}
					type="button"
				>
					<div>
						<File
							aria-hidden={true}
							className="mx-auto h-12 w-12 text-muted-foreground"
						/>
						<div className="flex text-muted-foreground text-sm leading-6">
							<p>Drag and drop or</p>
							<span className="relative cursor-pointer rounded-sm pl-1 font-medium text-primary hover:underline hover:underline-offset-4">
								choose file
							</span>
							<p className="pl-1">to upload</p>
						</div>
					</div>
				</button>

				<p className="mt-2 text-muted-foreground text-xs leading-5 sm:flex sm:items-center sm:justify-between">
					<span>Accepted file types: IPA or APP files.</span>
					<span className="pl-1 sm:pl-0">Max. size: 100MB</span>
				</p>

				{file && (
					<Card className="relative mt-8 gap-4 bg-muted p-4">
						<Button
							aria-label="Remove"
							className="absolute top-1 right-1 h-8 w-8 text-muted-foreground hover:text-foreground"
							onClick={resetFile}
							size="icon"
							type="button"
							variant="ghost"
						>
							<X
								aria-hidden={true}
								className="h-5 w-5 shrink-0"
							/>
						</Button>

						{metadata && !fetchingMetadata ? (
							<div className="space-y-4">
								<div className="flex items-start space-x-3">
									{metadata.icon ? (
										<Image
											alt={`${metadata.name} icon`}
											className="h-16 w-16 rounded-lg border shadow-sm"
											height={64}
											src={`/api/proxy?url=${encodeURIComponent(metadata.icon)}`}
											width={64}
										/>
									) : (
										<div className="flex h-10 w-10 shrink-0 items-center justify-center">
											<File className="h-5 w-5 text-foreground" />
										</div>
									)}
									<div className="min-w-0 flex-1">
										<h3 className="truncate font-semibold text-foreground text-sm">
											{metadata.name}
										</h3>
										<p className="truncate text-muted-foreground text-xs">
											{metadata.developer}
										</p>
										{metadata.rating > 0 && (
											<div className="mt-1 flex items-center space-x-2">
												<Rating
													className="text-accent-foreground"
													readOnly
													value={metadata.rating}
												>
													<RatingButton size={12} />
													<RatingButton size={12} />
													<RatingButton size={12} />
													<RatingButton size={12} />
													<RatingButton size={12} />
												</Rating>
												<span className="text-muted-foreground text-xs">
													{metadata.rating.toFixed(1)}
												</span>
											</div>
										)}
									</div>
								</div>

								{metadata.description && (
									<div>
										<p className="line-clamp-2 text-muted-foreground text-xs leading-relaxed">
											{metadata.description}
										</p>
									</div>
								)}

								<div className="border-border border-t pt-2">
									<div className="flex items-center space-x-2">
										<File className="h-4 w-4 text-muted-foreground" />
										<div>
											<p className="font-medium text-foreground text-xs">
												{file.name}
											</p>
											<p className="text-muted-foreground text-xs">
												{formatFileSize(file.size)}
											</p>
										</div>
									</div>
								</div>

								{(uploading || uploaded) && (
									<div className="flex items-center space-x-3">
										<Progress
											className="h-1.5"
											value={progress}
										/>
										<span className="text-muted-foreground text-xs">
											{progress}%
										</span>
									</div>
								)}
							</div>
						) : (
							<div className="space-y-4">
								<div className="flex items-center space-x-2.5">
									<span className="flex h-10 w-10 shrink-0 items-center justify-center">
										<File className="h-5 w-5 text-foreground" />
									</span>
									<div>
										<p className="font-medium text-foreground text-xs">
											{file.name}
										</p>
										<p className="mt-0.5 text-muted-foreground text-xs">
											{formatFileSize(file.size)}
										</p>
									</div>
								</div>

								<div className="flex items-center space-x-3">
									<Progress
										className="h-1.5"
										value={progress}
									/>
									<span className="text-muted-foreground text-xs">
										{progress}%
									</span>
								</div>
							</div>
						)}
					</Card>
				)}

				<div className="mt-8 flex items-center justify-end space-x-3">
					<Button
						aria-label="Upload"
						className="whitespace-nowrap"
						disabled={
							!(file && metadata) ||
							uploading ||
							uploaded ||
							fetchingMetadata
						}
						onClick={uploadFile}
						type="submit"
					>
						{getUploadButtonText()}
					</Button>
				</div>
			</form>
		</div>
	);
}
