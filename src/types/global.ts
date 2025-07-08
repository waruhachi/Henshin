export interface AppMetadata {
	icon: string;
	name: string;
	version: string;
	bundleId: string;
	rating: number;
	description?: string;
	developer?: string;
	isPartial?: boolean;
}

export interface ProcessingFlags {
	outputPath: string;
	cyanFiles: File[];
	injectFiles: File[];
	nameOverride: string;
	versionOverride: string;
	bundleIdOverride: string;
	minVersionOverride: string;
	keyOverride: File | null;
	launchImageOverride: File | null;
	iconOverride: File | null;
	removeUISupportedDevices: boolean;
	removeWatchApp: boolean;
	removeiPadSupport: boolean;
	fakesign: boolean;
	removePlugins: boolean;
	removeExtensions: boolean;
	removeAppGroups: boolean;
	compressionLevel: number;
	ignoreEncrypted: boolean;
	overwrite: boolean;
}

export interface ConfigurationModalProps {
	metadata: AppMetadata | null;
	flags: ProcessingFlags;
	onFlagsChange: (flags: ProcessingFlags) => void;
	onProcess: () => void;
	onClose: () => void;
	loading?: boolean;
}

export type AppStoreMetadata = {
	artworkUrl512?: string;
	artworkUrl100?: string;
	trackName?: string;
	version?: string;
	bundleId?: string;
	averageUserRating?: number;
	description?: string;
	artistName?: string;
	formattedPrice?: string;
	fileSizeBytes?: string;
	primaryGenreName?: string;
};

export interface InfoPlist {
	UIRequiredDeviceCapabilities?: string[];
	CFBundleInfoDictionaryVersion?: string;
	'UISupportedInterfaceOrientations~ipad'?: string[];
	DTPlatformVersion?: string;
	NSUserActivityTypes?: string[];
	CFBundleName?: string;
	DTSDKName?: string;
	CFBundleIcons?: {
		CFBundlePrimaryIcon?: {
			CFBundleIconFiles?: string[];
			CFBundleIconName?: string;
		};
	};
	CFBundleDisplayName?: string;
	LSRequiresIPhoneOS?: boolean;
	CFBundleDocumentTypes?: Array<{
		CFBundleTypeName?: string;
		CFBundleTypeRole?: string;
		CFBundleTypeIconFiles?: string[];
		LSItemContentTypes?: string[];
		LSHandlerRank?: string;
	}>;
	DTSDKBuild?: string;
	CFBundleShortVersionString?: string;
	CFBundleSupportedPlatforms?: string[];
	UISupportedInterfaceOrientations?: string[];
	INIntentsSupported?: string[];
	BuildMachineOSBuild?: string;
	DTPlatformBuild?: string;
	CFBundlePackageType?: string;
	DTXcodeBuild?: string;
	CFBundleDevelopmentRegion?: string;
	MinimumOSVersion?: string;
	CFBundleVersion?: string;
	NSPhotoLibraryAddUsageDescription?: string;
	UIFileSharingEnabled?: boolean;
	UTExportedTypeDeclarations?: Array<{
		UTTypeIconFiles?: string[];
		UTTypeIdentifier?: string;
		UTTypeConformsTo?: string[];
		UTTypeDescription?: string;
		UTTypeTagSpecification?: {
			'public.filename-extension'?: string[];
			[key: string]: unknown;
		};
	}>;
	LSSupportsOpeningDocumentsInPlace?: boolean;
	UIDeviceFamily?: number[];
	UILaunchStoryboardName?: string;
	CFBundleIdentifier?: string;
	UIApplicationSceneManifest?: {
		UIApplicationSupportsMultipleScenes?: boolean;
		UISceneConfigurations?: {
			UIWindowSceneSessionRoleApplication?: Array<{
				UISceneStoryboardFile?: string;
				UISceneConfigurationName?: string;
				UISceneDelegateClassName?: string;
			}>;
			[key: string]: unknown;
		};
	};
	DTXcode?: string;
	CFBundleExecutable?: string;
	'CFBundleIcons~ipad'?: {
		CFBundlePrimaryIcon?: {
			CFBundleIconFiles?: string[];
			CFBundleIconName?: string;
		};
	};
	UIMainStoryboardFile?: string;
	DTPlatformName?: string;
	DTXcodeBuildDistribution?: string;
	ITSAppUsesNonExemptEncryption?: boolean;
	DTCompiler?: string;
	DTAppStoreToolsBuild?: string;
}
