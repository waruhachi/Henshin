'use client';

import type {
	ButtonHTMLAttributes,
	Dispatch,
	HTMLAttributes,
	KeyboardEventHandler,
	MouseEventHandler,
	ReactElement,
	ReactNode,
	SetStateAction,
} from 'react';

import { Root as Portal } from '@radix-ui/react-portal';
import {
	Children,
	cloneElement,
	createContext,
	useContext,
	useEffect,
	useState,
} from 'react';

import { cn } from '@/lib/utils';

type DialogStackContextType = {
	activeIndex: number;
	setActiveIndex: Dispatch<SetStateAction<number>>;
	totalDialogs: number;
	setTotalDialogs: Dispatch<SetStateAction<number>>;
	isOpen: boolean;
	setIsOpen: Dispatch<SetStateAction<boolean>>;
	clickable: boolean;
};

const DialogStackContext = createContext<DialogStackContextType>({
	activeIndex: 0,
	setActiveIndex: () => {
		// Default empty implementation
	},
	totalDialogs: 0,
	setTotalDialogs: () => {
		// Default empty implementation
	},
	isOpen: false,
	setIsOpen: () => {
		// Default empty implementation
	},
	clickable: false,
});

type DialogStackChildProps = {
	index?: number;
};

export const DialogStack = ({
	children,
	className,
	open = false,
	onOpenChange,
	clickable = false,
	...props
}: HTMLAttributes<HTMLDivElement> & {
	open?: boolean;
	clickable?: boolean;
	onOpenChange?: (isOpen: boolean) => void;
}) => {
	const [activeIndex, setActiveIndex] = useState(0);
	const [isOpen, setIsOpen] = useState(open);

	useEffect(() => {
		onOpenChange?.(isOpen);
	}, [isOpen, onOpenChange]);

	return (
		<DialogStackContext.Provider
			value={{
				activeIndex,
				setActiveIndex,
				totalDialogs: 0,
				setTotalDialogs: () => {
					// Implementation will be provided by DialogStackBody
				},
				isOpen,
				setIsOpen,
				clickable,
			}}
		>
			<div className={className} {...props}>
				{children}
			</div>
		</DialogStackContext.Provider>
	);
};

export const DialogStackTrigger = ({
	children,
	className,
	onClick,
	asChild,
	...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }) => {
	const context = useContext(DialogStackContext);

	if (!context) {
		throw new Error('DialogStackTrigger must be used within a DialogStack');
	}

	const handleClick: MouseEventHandler<HTMLButtonElement> = (e) => {
		context.setIsOpen(true);
		onClick?.(e);
	};

	if (asChild && children) {
		const child = children as ReactElement<
			ButtonHTMLAttributes<HTMLButtonElement> & { className?: string }
		>;
		return cloneElement(child, {
			onClick: handleClick,
			className: cn(className, child.props.className),
			...props,
		});
	}

	return (
		<button
			className={cn(
				'inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium text-sm',
				'ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2',
				'focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
				'bg-primary text-primary-foreground hover:bg-primary/90',
				'h-10 px-4 py-2',
				className
			)}
			onClick={handleClick}
			{...props}
		>
			{children}
		</button>
	);
};

export const DialogStackOverlay = ({
	className,
	onClick,
	onKeyDown,
	...props
}: ButtonHTMLAttributes<HTMLButtonElement>) => {
	const context = useContext(DialogStackContext);

	if (!context) {
		throw new Error('DialogStackOverlay must be used within a DialogStack');
	}

	if (!context.isOpen) {
		return null;
	}

	const handleClick: MouseEventHandler<HTMLButtonElement> = (e) => {
		context.setIsOpen(false);
		onClick?.(e);
	};

	const handleKeyDown: KeyboardEventHandler<HTMLButtonElement> = (e) => {
		if (e.key === 'Escape') {
			context.setIsOpen(false);
		}
		onKeyDown?.(e);
	};

	return (
		<button
			aria-label="Close dialog"
			className={cn(
				'fixed inset-0 z-50 cursor-pointer border-none bg-black/80 p-0',
				'data-[state=closed]:animate-out data-[state=open]:animate-in',
				'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
				className
			)}
			onClick={handleClick}
			onKeyDown={handleKeyDown}
			type="button"
			{...props}
		/>
	);
};

export const DialogStackBody = ({
	children,
	className,
	...props
}: HTMLAttributes<HTMLDivElement> & {
	children:
		| ReactElement<DialogStackChildProps>[]
		| ReactElement<DialogStackChildProps>;
}) => {
	const context = useContext(DialogStackContext);
	const [totalDialogs, setTotalDialogs] = useState(Children.count(children));

	if (!context) {
		throw new Error('DialogStackBody must be used within a DialogStack');
	}

	if (!context.isOpen) {
		return null;
	}

	return (
		<DialogStackContext.Provider
			value={{
				...context,
				totalDialogs,
				setTotalDialogs,
			}}
		>
			<Portal>
				<div
					className={cn(
						'pointer-events-none fixed inset-0 z-50 mx-auto flex w-full max-w-lg flex-col items-center justify-center',
						className
					)}
					{...props}
				>
					<div className="pointer-events-auto relative flex w-full flex-col items-center justify-center">
						{Children.map(children, (child, index) => {
							const childElement =
								child as ReactElement<DialogStackChildProps>;
							return cloneElement(childElement, { index });
						})}
					</div>
				</div>
			</Portal>
		</DialogStackContext.Provider>
	);
};

export const DialogStackContent = ({
	children,
	className,
	index = 0,
	offset = 10,
	...props
}: HTMLAttributes<HTMLDivElement> & {
	index?: number;
	offset?: number;
}) => {
	const context = useContext(DialogStackContext);

	if (!context) {
		throw new Error('DialogStackContent must be used within a DialogStack');
	}

	if (!context.isOpen) {
		return null;
	}

	const distanceFromActive = index - context.activeIndex;
	const translateY =
		distanceFromActive < 0
			? `-${Math.abs(distanceFromActive) * offset}px`
			: `${Math.abs(distanceFromActive) * offset}px`;

	const isClickable = context.clickable && context.activeIndex > index;

	const commonStyle = {
		top: 0,
		transform: `translateY(${translateY})`,
		width: `calc(100% - ${Math.abs(distanceFromActive) * 10}px)`,
		zIndex: 50 - Math.abs(context.activeIndex - (index ?? 0)),
		position: distanceFromActive ? 'absolute' : 'relative',
		opacity: distanceFromActive > 0 ? 0 : 1,
	} as const;

	const commonClassName = cn(
		'h-auto w-full rounded-lg border bg-background p-6 shadow-lg transition-all duration-300',
		className
	);

	if (isClickable) {
		const handleClick: MouseEventHandler<HTMLButtonElement> = () => {
			context.setActiveIndex(index ?? 0);
		};

		const handleKeyDown: KeyboardEventHandler<HTMLButtonElement> = (e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				context.setActiveIndex(index ?? 0);
			}
		};

		return (
			<button
				aria-label="Go to previous step"
				className={cn(commonClassName, 'cursor-pointer text-left')}
				onClick={handleClick}
				onKeyDown={handleKeyDown}
				style={{
					...commonStyle,
					position: distanceFromActive ? 'absolute' : 'relative',
				}}
				type="button"
			>
				<div
					className={cn(
						'h-full w-full transition-all duration-300',
						context.activeIndex !== index &&
							'pointer-events-none select-none opacity-0'
					)}
				>
					{children}
				</div>
			</button>
		);
	}

	return (
		<div
			className={commonClassName}
			style={{
				...commonStyle,
				position: distanceFromActive ? 'absolute' : 'relative',
				cursor: 'default',
			}}
			{...props}
		>
			<div
				className={cn(
					'h-full w-full transition-all duration-300',
					context.activeIndex !== index &&
						'pointer-events-none select-none opacity-0'
				)}
			>
				{children}
			</div>
		</div>
	);
};

export const DialogStackTitle = ({
	children,
	className,
	...props
}: HTMLAttributes<HTMLHeadingElement>) => (
	<h2
		className={cn(
			'font-semibold text-lg leading-none tracking-tight',
			className
		)}
		{...props}
	>
		{children}
	</h2>
);

export const DialogStackDescription = ({
	children,
	className,
	...props
}: HTMLAttributes<HTMLParagraphElement>) => (
	<p className={cn('text-muted-foreground text-sm', className)} {...props}>
		{children}
	</p>
);

export const DialogStackHeader = ({
	className,
	...props
}: HTMLAttributes<HTMLDivElement>) => (
	<div
		className={cn(
			'flex flex-col space-y-1.5 text-center sm:text-left',
			className
		)}
		{...props}
	/>
);

export const DialogStackFooter = ({
	children,
	className,
	...props
}: HTMLAttributes<HTMLDivElement>) => (
	<div
		className={cn(
			'flex items-center justify-between space-x-2 pt-4',
			className
		)}
		{...props}
	>
		{children}
	</div>
);

export const DialogStackNext = ({
	children,
	className,
	asChild,
	...props
}: {
	asChild?: boolean;
} & HTMLAttributes<HTMLButtonElement>) => {
	const context = useContext(DialogStackContext);

	if (!context) {
		throw new Error('DialogStackNext must be used within a DialogStack');
	}

	const handleNext = () => {
		if (context.activeIndex < context.totalDialogs - 1) {
			context.setActiveIndex(context.activeIndex + 1);
		}
	};

	if (asChild && children) {
		const child = children as ReactElement<
			ButtonHTMLAttributes<HTMLButtonElement> & { className?: string }
		>;
		return cloneElement(child, {
			onClick: handleNext,
			className: cn(className, child.props.className),
			...props,
		});
	}

	return (
		<button
			className={cn(
				'inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
				className
			)}
			disabled={context.activeIndex >= context.totalDialogs - 1}
			onClick={handleNext}
			type="button"
			{...props}
		>
			{children || 'Next'}
		</button>
	);
};

export const DialogStackPrevious = ({
	children,
	className,
	asChild,
	...props
}: {
	children?: ReactNode;
	className?: string;
	asChild?: boolean;
} & HTMLAttributes<HTMLButtonElement>) => {
	const context = useContext(DialogStackContext);

	if (!context) {
		throw new Error(
			'DialogStackPrevious must be used within a DialogStack'
		);
	}

	const handlePrevious = () => {
		if (context.activeIndex > 0) {
			context.setActiveIndex(context.activeIndex - 1);
		}
	};

	if (asChild && children) {
		const child = children as ReactElement<
			ButtonHTMLAttributes<HTMLButtonElement> & { className?: string }
		>;
		return cloneElement(child, {
			onClick: handlePrevious,
			className: cn(className, child.props.className),
			...props,
		});
	}

	return (
		<button
			className={cn(
				'inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
				className
			)}
			disabled={context.activeIndex <= 0}
			onClick={handlePrevious}
			type="button"
			{...props}
		>
			{children || 'Previous'}
		</button>
	);
};
