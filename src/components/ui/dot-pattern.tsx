import type React from 'react';

import { cn } from '@/lib/utils';

type BGPatternProps = React.ComponentProps<'div'> & {
	size?: number;
	fill?: string;
	dotSize?: number;
};

const BGPattern = ({
	size = 24,
	fill = '#a0bbe3',
	dotSize = 1.5,
	className,
	style,
	...props
}: BGPatternProps) => {
	const backgroundSize = `${size}px ${size}px`;
	const backgroundImage = `radial-gradient(${fill} ${dotSize}px, transparent ${dotSize}px)`;

	return (
		<div
			className={cn(
				'absolute inset-0 z-[-10] size-full',
				'[mask-image:radial-gradient(ellipse_at_center,var(--background),transparent)]',
				className
			)}
			style={{
				backgroundImage,
				backgroundSize,
				...style,
			}}
			{...props}
		/>
	);
};

BGPattern.displayName = 'BGPattern';

export default function DotPattern() {
	return <BGPattern />;
}
