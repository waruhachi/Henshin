import DotPattern from '@/components/ui/dot-pattern';
import FileUpload from '@/components/ui/file-upload';

export default function Home() {
	return (
		<div className="relative h-screen w-screen">
			<DotPattern />
			<div className="absolute inset-0 flex items-center justify-center">
				<FileUpload />
			</div>
		</div>
	);
}
