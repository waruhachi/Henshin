'use client';

import type { AppMetadata } from '@/types/global';

import { AlertTriangle, CheckCircle, File, Hash, X } from 'lucide-react';
import Image from 'next/image';
import {
	type ChangeEvent,
	type DragEvent,
	useEffect,
	useRef,
	useState,
} from 'react';
import { toast } from 'sonner';

import { getMetadata } from '@/app/actions/metadata';
import { BorderBeam } from '@/components/ui/border-beam';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
	DialogStack,
	DialogStackBody,
	DialogStackContent,
	DialogStackDescription,
	DialogStackFooter,
	DialogStackHeader,
	DialogStackNext,
	DialogStackOverlay,
	DialogStackPrevious,
	DialogStackTitle,
} from '@/components/ui/dialog-stack';
import { Button as DialogButton } from '@/components/ui/dialog-stack-button';
import { Progress } from '@/components/ui/progress';
import { Rating, RatingButton } from '@/components/ui/rating';
import { Slider } from '@/components/ui/slider';
import { useUploadThing } from '@/lib/uploadthing';

type UploadThingResponse = {
	ufsUrl: string;
	url: string;
	appUrl: string;
	fileHash: string;
	serverData: null;
};

export default function FileUpload() {
	const [uploadState, setUploadState] = useState<{
		file: File | null;
		progress: number;
		metadata: AppMetadata | null;
		fetchingMetadata: boolean;
		metadataFetchFailed: boolean;
		uploaded: boolean;
		fileHash: string | null;
		uploadResponse: UploadThingResponse | null;
	}>({
		file: null,
		progress: 0,
		metadata: null,
		fetchingMetadata: false,
		metadataFetchFailed: false,
		uploaded: false,
		fileHash: null,
		uploadResponse: null,
	});
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [compressionLevel, setCompressionLevel] = useState([6]);

	const { startUpload, isUploading } = useUploadThing('ipaUploader', {
		onClientUploadComplete: (res) => {
			const response = res[0];
			setUploadState((prev) => ({
				...prev,
				uploaded: true,
				progress: 100,
				fileHash: response?.fileHash || null,
				uploadResponse: response,
			}));

			setDialogOpen(true);

			toast.success('File uploaded successfully!', {
				position: 'bottom-right',
				duration: 3000,
			});
		},
		onUploadError: (error: Error) => {
			toast.error(`Failed to upload file: ${error.message}`, {
				position: 'bottom-right',
				duration: 3000,
			});
			setUploadState((prev) => ({
				...prev,
				progress: 0,
			}));
		},
		onUploadProgress: (progressPercentage) => {
			setUploadState((prev) => ({
				...prev,
				progress: progressPercentage,
			}));
		},
	});

	const deleteUploadedFile = async (fileKey: string) => {
		try {
			const response = await fetch('/api/uploadthing/delete', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ fileKey }),
			});

			if (!response.ok) {
				throw new Error('Failed to delete file');
			}
		} catch {
			// Don't show error to user as this is cleanup
		}
	};

	useEffect(() => {
		const handleBeforeUnload = () => {
			if (uploadState.uploadResponse?.url) {
				const fileKey = uploadState.uploadResponse.url.split('/').pop();
				if (fileKey) {
					navigator.sendBeacon(
						'/api/uploadthing/delete',
						JSON.stringify({ fileKey })
					);
				}
			}
		};

		window.addEventListener('beforeunload', handleBeforeUnload);
		return () =>
			window.removeEventListener('beforeunload', handleBeforeUnload);
	}, [uploadState.uploadResponse]);

	const cleanupPreviousFile = async () => {
		if (uploadState.uploadResponse?.url) {
			const fileKey = uploadState.uploadResponse.url.split('/').pop();
			if (fileKey) {
				await deleteUploadedFile(fileKey);
			}
		}
	};

	const validateFileExtension = (fileName: string) => {
		const lowerFileName = fileName.toLowerCase();
		return (
			lowerFileName.endsWith('.ipa') || lowerFileName.endsWith('.app.zip')
		);
	};

	const initializeUploadState = (selectedFile: File) => {
		setUploadState({
			file: selectedFile,
			progress: 0,
			metadata: null,
			fetchingMetadata: true,
			metadataFetchFailed: false,
			uploaded: false,
			fileHash: null,
			uploadResponse: null,
		});
	};

	const processMetadata = async (selectedFile: File) => {
		try {
			const formData = new FormData();
			formData.append('ipa', selectedFile);
			const appMetadata = await getMetadata(formData);

			setUploadState((prev) => ({
				...prev,
				metadata: appMetadata,
				fetchingMetadata: false,
			}));

			if (appMetadata.isPartial) {
				toast.warning('App Store metadata unavailable.', {
					position: 'bottom-right',
					duration: 5000,
				});
			}

			setTimeout(() => {
				if (selectedFile) {
					startUpload([selectedFile]);
				}
			}, 1000);
		} catch {
			toast.error('Failed to parse IPA file metadata', {
				position: 'bottom-right',
				duration: 3000,
			});
			setUploadState((prev) => ({
				...prev,
				fetchingMetadata: false,
				metadataFetchFailed: true,
			}));
		}
	};

	const handleFile = async (selectedFile: File | undefined) => {
		if (!selectedFile) {
			return;
		}

		await cleanupPreviousFile();

		if (validateFileExtension(selectedFile.name)) {
			initializeUploadState(selectedFile);
			await processMetadata(selectedFile);
		} else {
			toast.error('Please upload a IPA or APP file.', {
				position: 'bottom-right',
				duration: 3000,
			});
		}
	};

	const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
		handleFile(event.target.files?.[0]);
	};

	const handleDrop = (event: DragEvent<HTMLButtonElement>) => {
		event.preventDefault();
		handleFile(event.dataTransfer.files?.[0]);
	};

	const resetFile = async () => {
		if (uploadState.uploadResponse?.ufsUrl) {
			const fileKey = uploadState.uploadResponse.ufsUrl.split('/').pop();
			if (fileKey) {
				await deleteUploadedFile(fileKey);
			}
		}

		setUploadState({
			file: null,
			progress: 0,
			metadata: null,
			fetchingMetadata: false,
			metadataFetchFailed: false,
			uploaded: false,
			fileHash: null,
			uploadResponse: null,
		});
		if (fileInputRef.current) {
			fileInputRef.current.value = '';
		}
	};

	const renderMetadataContent = () => {
		if (metadata && !fetchingMetadata) {
			return (
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
							<div className="flex items-center space-x-1">
								<p className="truncate text-muted-foreground text-xs">
									{metadata.developer || 'Unknown Developer'}
								</p>
								{metadata.isPartial && (
									<div className="flex items-center space-x-1">
										<AlertTriangle className="h-3 w-3 text-amber-500" />
										<span className="text-amber-600 text-xs">
											Limited info
										</span>
									</div>
								)}
							</div>
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

					{isUploading && (
						<div className="flex items-center space-x-3">
							<Progress className="h-1.5" value={progress} />
							<span className="text-muted-foreground text-xs">
								{progress}%
							</span>
						</div>
					)}
				</div>
			);
		}

		if (fetchingMetadata) {
			return (
				<div className="space-y-4">
					<div className="flex items-start space-x-3">
						<div className="flex h-10 w-10 shrink-0 items-center justify-center">
							<File className="h-5 w-5 text-foreground" />
						</div>
						<div className="min-w-0 flex-1">
							<h3 className="truncate font-semibold text-foreground text-sm">
								{uploadState.file?.name}
							</h3>
							<p className="truncate text-muted-foreground text-xs">
								Parsing metadata...
							</p>
						</div>
					</div>
				</div>
			);
		}

		return null;
	};

	const {
		file,
		progress,
		metadata,
		fetchingMetadata,
		metadataFetchFailed,
		uploaded,
		fileHash,
	} = uploadState;

	return (
		<div className="relative flex w-full max-w-lg items-center justify-center rounded-lg bg-card p-5">
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
					<span className="pl-1 sm:pl-0">Max. size: 1GB</span>
				</p>

				{file && !metadataFetchFailed && (
					<Card className="relative mt-8 gap-4 bg-muted p-4">
						{!fetchingMetadata && (
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
						)}

						{renderMetadataContent()}
					</Card>
				)}

				<div className="mt-8 flex items-center justify-end space-x-3">
					{uploaded && fileHash && (
						<DialogStack
							onOpenChange={(open) => {
								setDialogOpen(open);
								if (!open) {
									resetFile();
								}
							}}
							open={dialogOpen}
						>
							<DialogStackOverlay />
							<DialogStackBody>
								<DialogStackContent className="min-h-96">
									<DialogStackHeader>
										<DialogStackTitle className="flex items-center gap-2">
											<File className="h-5 w-5 text-blue-500" />
											File Injection
										</DialogStackTitle>
										<DialogStackDescription>
											Upload .cyan files and tweaks/items
											to inject into the app.
										</DialogStackDescription>
									</DialogStackHeader>
									<div className="space-y-4 py-4">
										<div className="grid grid-cols-1 gap-4">
											<div className="space-y-2">
												<label
													className="font-medium text-sm"
													htmlFor="cyan-files"
												>
													.cyan Files
												</label>
												<input
													accept=".cyan"
													className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs file:border-0 file:bg-transparent file:font-medium file:text-sm placeholder:text-muted-foreground"
													id="cyan-files"
													multiple
													type="file"
												/>
											</div>
											<div className="space-y-2">
												<label
													className="font-medium text-sm"
													htmlFor="tweaks-files"
												>
													Tweaks/Items to Inject
												</label>
												<input
													className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs file:border-0 file:bg-transparent file:font-medium file:text-sm placeholder:text-muted-foreground"
													id="tweaks-files"
													multiple
													type="file"
												/>
											</div>
										</div>
									</div>
									<DialogStackFooter>
										<div />
										<DialogStackNext asChild>
											<DialogButton>Next</DialogButton>
										</DialogStackNext>
									</DialogStackFooter>
								</DialogStackContent>

								<DialogStackContent className="min-h-96">
									<DialogStackHeader>
										<DialogStackTitle className="flex items-center gap-2">
											<CheckCircle className="h-5 w-5 text-green-500" />
											App Configuration
										</DialogStackTitle>
										<DialogStackDescription>
											Configure app metadata and basic
											properties.
										</DialogStackDescription>
									</DialogStackHeader>
									<div className="space-y-4 py-4">
										<div className="grid grid-cols-1 gap-4">
											<div className="grid grid-cols-2 gap-4">
												<div className="space-y-2">
													<label
														className="font-medium text-sm"
														htmlFor="app-name"
													>
														App Name
													</label>
													<input
														className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs placeholder:text-muted-foreground"
														id="app-name"
														placeholder="Enter app name"
														type="text"
													/>
												</div>
												<div className="space-y-2">
													<label
														className="font-medium text-sm"
														htmlFor="app-version"
													>
														App Version
													</label>
													<input
														className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs placeholder:text-muted-foreground"
														id="app-version"
														placeholder="1.0.0"
														type="text"
													/>
												</div>
											</div>
											<div className="grid grid-cols-2 gap-4">
												<div className="space-y-2">
													<label
														className="font-medium text-sm"
														htmlFor="bundle-id"
													>
														Bundle Identifier
													</label>
													<input
														className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs placeholder:text-muted-foreground"
														id="bundle-id"
														placeholder="com.example.app"
														type="text"
													/>
												</div>
												<div className="space-y-2">
													<label
														className="font-medium text-sm"
														htmlFor="min-os-version"
													>
														Minimum OS Version
													</label>
													<input
														className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs placeholder:text-muted-foreground"
														id="min-os-version"
														placeholder="14.0"
														type="text"
													/>
												</div>
											</div>
											<div className="grid grid-cols-2 gap-4">
												<div className="space-y-2">
													<label
														className="font-medium text-sm"
														htmlFor="custom-icon"
													>
														Custom Icon
													</label>
													<input
														accept="image/*"
														className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs file:border-0 file:bg-transparent file:font-medium file:text-sm placeholder:text-muted-foreground"
														id="custom-icon"
														type="file"
													/>
												</div>
												<div className="space-y-2">
													<label
														className="font-medium text-sm"
														htmlFor="plist-merge"
													>
														Info.plist Merge
													</label>
													<input
														accept=".plist"
														className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs file:border-0 file:bg-transparent file:font-medium file:text-sm placeholder:text-muted-foreground"
														id="plist-merge"
														type="file"
													/>
												</div>
											</div>
											<div className="space-y-2">
												<label
													className="font-medium text-sm"
													htmlFor="entitlements"
												>
													Entitlements
												</label>
												<input
													accept=".plist,.xml"
													className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs file:border-0 file:bg-transparent file:font-medium file:text-sm placeholder:text-muted-foreground"
													id="entitlements"
													type="file"
												/>
											</div>
										</div>
									</div>
									<DialogStackFooter>
										<DialogStackPrevious asChild>
											<DialogButton variant="outline">
												Previous
											</DialogButton>
										</DialogStackPrevious>
										<DialogStackNext asChild>
											<DialogButton>Next</DialogButton>
										</DialogStackNext>
									</DialogStackFooter>
								</DialogStackContent>

								<DialogStackContent className="min-h-96">
									<DialogStackHeader>
										<DialogStackTitle className="flex items-center gap-2">
											<Hash className="h-5 w-5 text-purple-500" />
											Binary Tweaks & Compression
										</DialogStackTitle>
										<DialogStackDescription>
											Configure binary modifications and
											compression settings for the output
											IPA.
										</DialogStackDescription>
									</DialogStackHeader>
									<div className="space-y-6 py-4">
										<div className="space-y-4">
											<div className="space-y-3">
												<h4 className="font-medium text-sm">
													Binary Modifications
												</h4>
												<div className="grid grid-cols-1 gap-3">
													<div className="flex items-center space-x-2">
														<input
															className="h-4 w-4 rounded border border-input"
															id="remove-supported-devices"
															type="checkbox"
														/>
														<label
															className="font-medium text-sm leading-none"
															htmlFor="remove-supported-devices"
														>
															Remove Supported
															Devices
														</label>
													</div>
													<div className="flex items-center space-x-2">
														<input
															className="h-4 w-4 rounded border border-input"
															id="remove-watch-apps"
															type="checkbox"
														/>
														<label
															className="font-medium text-sm leading-none"
															htmlFor="remove-watch-apps"
														>
															Remove Watch Apps
														</label>
													</div>
													<div className="flex items-center space-x-2">
														<input
															className="h-4 w-4 rounded border border-input"
															id="enable-documents"
															type="checkbox"
														/>
														<label
															className="font-medium text-sm leading-none"
															htmlFor="enable-documents"
														>
															Enable Documents
															Support
														</label>
													</div>
													<div className="flex items-center space-x-2">
														<input
															className="h-4 w-4 rounded border border-input"
															id="fakesign-binaries"
															type="checkbox"
														/>
														<label
															className="font-medium text-sm leading-none"
															htmlFor="fakesign-binaries"
														>
															Fakesign Binaries
														</label>
													</div>
													<div className="flex items-center space-x-2">
														<input
															className="h-4 w-4 rounded border border-input"
															id="thin-arm64"
															type="checkbox"
														/>
														<label
															className="font-medium text-sm leading-none"
															htmlFor="thin-arm64"
														>
															Thin to arm64
														</label>
													</div>
													<div className="flex items-center space-x-2">
														<input
															className="h-4 w-4 rounded border border-input"
															id="remove-extensions"
															type="checkbox"
														/>
														<label
															className="font-medium text-sm leading-none"
															htmlFor="remove-extensions"
														>
															Remove Extensions
														</label>
													</div>
													<div className="flex items-center space-x-2">
														<input
															className="h-4 w-4 rounded border border-input"
															id="remove-encrypted-extensions"
															type="checkbox"
														/>
														<label
															className="font-medium text-sm leading-none"
															htmlFor="remove-encrypted-extensions"
														>
															Remove Encrypted
															Extensions
														</label>
													</div>
													<div className="flex items-center space-x-2">
														<input
															className="h-4 w-4 rounded border border-input"
															id="ignore-main-binary"
															type="checkbox"
														/>
														<label
															className="font-medium text-sm leading-none"
															htmlFor="ignore-main-binary"
														>
															Ignore Main Binary
															Encryption
														</label>
													</div>
													<div className="flex items-center space-x-2">
														<input
															className="h-4 w-4 rounded border border-input"
															id="overwrite-existing"
															type="checkbox"
														/>
														<label
															className="font-medium text-sm leading-none"
															htmlFor="overwrite-existing"
														>
															Overwrite Existing
															Files
														</label>
													</div>
												</div>
											</div>
										</div>
										<div className="space-y-4">
											<div className="space-y-3">
												<h4 className="font-medium text-sm">
													Compression Settings
												</h4>
												<div className="space-y-2">
													<label
														className="font-medium text-sm"
														htmlFor="compression-level"
													>
														Compression Level
													</label>
													<p className="text-muted-foreground text-xs">
														Set IPA compression
														level (0-9, default: 6)
													</p>
												</div>
												<div className="px-2">
													<Slider
														className="w-full"
														id="compression-level"
														max={9}
														min={0}
														onValueChange={
															setCompressionLevel
														}
														step={1}
														value={compressionLevel}
													/>
													<div className="mt-2 flex justify-between text-muted-foreground text-xs">
														<span>0</span>
														<span>1</span>
														<span>2</span>
														<span>3</span>
														<span>4</span>
														<span>5</span>
														<span>6</span>
														<span>7</span>
														<span>8</span>
														<span>9</span>
													</div>
												</div>
												<div className="text-center">
													<span className="rounded-md bg-muted px-2 py-1 font-medium text-sm">
														Level:{' '}
														{compressionLevel[0]}
													</span>
												</div>
											</div>
										</div>
									</div>
									<DialogStackFooter>
										<DialogStackPrevious asChild>
											<DialogButton variant="outline">
												Previous
											</DialogButton>
										</DialogStackPrevious>
										<Button
											onClick={() => setDialogOpen(false)}
										>
											Apply Settings
										</Button>
									</DialogStackFooter>
								</DialogStackContent>
							</DialogStackBody>
						</DialogStack>
					)}
				</div>
			</form>
		</div>
	);
}
