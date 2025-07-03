import type { KeyboardEvent, MouseEvent, ReactElement, ReactNode } from 'react';

import { useControllableState } from '@radix-ui/react-use-controllable-state';
import { type LucideProps, StarIcon } from 'lucide-react';
import {
	Children,
	cloneElement,
	createContext,
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState,
} from 'react';

import { cn } from '@/lib/utils';

type RatingContextValue = {
	value: number;
	readOnly: boolean;
	hoverValue: number | null;
	focusedStar: number | null;
	handleValueChange: (
		event: MouseEvent<HTMLButtonElement> | KeyboardEvent<HTMLButtonElement>,
		value: number
	) => void;
	handleKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void;
	setHoverValue: (value: number | null) => void;
	setFocusedStar: (value: number | null) => void;
};
const RatingContext = createContext<RatingContextValue | null>(null);
const useRating = () => {
	const context = useContext(RatingContext);
	if (!context) {
		throw new Error('useRating must be used within a Rating component');
	}
	return context;
};
const renderStarContent = (
	isPartialStar: boolean,
	partialFill: number,
	isActive: boolean,
	icon: ReactElement<LucideProps>,
	size: number,
	readOnly: boolean
) => {
	if (isPartialStar) {
		return (
			<div className="relative">
				{cloneElement(icon, {
					size,
					className: cn(
						'transition-colors duration-200',
						!readOnly && 'cursor-pointer'
					),
					'aria-hidden': 'true',
				})}
				<div
					className="absolute inset-0 overflow-hidden"
					style={{ width: `${partialFill * 100}%` }}
				>
					{cloneElement(icon, {
						size,
						className: cn(
							'transition-colors duration-200',
							'fill-current',
							!readOnly && 'cursor-pointer'
						),
						'aria-hidden': 'true',
					})}
				</div>
			</div>
		);
	}

	return cloneElement(icon, {
		size,
		className: cn(
			'transition-colors duration-200',
			isActive && 'fill-current',
			!readOnly && 'cursor-pointer'
		),
		'aria-hidden': 'true',
	});
};

export type RatingButtonProps = LucideProps & {
	index?: number;
	icon?: ReactElement<LucideProps>;
};

const getNewValueFromKeyboard = (
	key: string,
	currentValue: number,
	total: number,
	hasModifier: boolean
): number | null => {
	switch (key) {
		case 'ArrowRight':
			return hasModifier ? total : Math.min(total, currentValue + 1);
		case 'ArrowLeft':
			return hasModifier ? 1 : Math.max(1, currentValue - 1);
		default:
			return null;
	}
};

export const RatingButton = ({
	index: providedIndex,
	size = 20,
	className,
	icon = <StarIcon />,
}: RatingButtonProps) => {
	const {
		value,
		readOnly,
		hoverValue,
		focusedStar,
		handleValueChange,
		handleKeyDown,
		setHoverValue,
		setFocusedStar,
	} = useRating();
	const index = providedIndex ?? 0;
	const currentValue = hoverValue ?? focusedStar ?? value ?? 0;

	const isFullyStar = index < Math.floor(currentValue);
	const isPartialStar =
		index === Math.floor(currentValue) && currentValue % 1 !== 0;
	const partialFill = isPartialStar ? currentValue % 1 : 0;
	const isActive = isFullyStar || isPartialStar;

	const iconSize =
		typeof size === 'string' ? Number.parseInt(size, 10) || 20 : size;

	let tabIndex = -1;
	if (!readOnly) {
		tabIndex = value === index + 1 ? 0 : -1;
	}
	const handleClick = useCallback(
		(event: MouseEvent<HTMLButtonElement>) => {
			handleValueChange(event, index + 1);
		},
		[handleValueChange, index]
	);
	const handleMouseEnter = useCallback(() => {
		if (!readOnly) {
			setHoverValue(index + 1);
		}
	}, [readOnly, setHoverValue, index]);
	const handleFocus = useCallback(() => {
		setFocusedStar(index + 1);
	}, [setFocusedStar, index]);
	const handleBlur = useCallback(() => {
		setFocusedStar(null);
	}, [setFocusedStar]);

	return (
		<button
			className={cn(
				'rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
				'p-0.5',
				readOnly && 'cursor-default',
				className
			)}
			disabled={readOnly}
			onBlur={handleBlur}
			onClick={handleClick}
			onFocus={handleFocus}
			onKeyDown={handleKeyDown}
			onMouseEnter={handleMouseEnter}
			tabIndex={tabIndex}
			type="button"
		>
			{renderStarContent(
				isPartialStar,
				partialFill,
				isActive,
				icon,
				iconSize,
				readOnly
			)}
		</button>
	);
};
export type RatingProps = {
	defaultValue?: number;
	value?: number;
	onChange?: (
		event: MouseEvent<HTMLButtonElement> | KeyboardEvent<HTMLButtonElement>,
		value: number
	) => void;
	onValueChange?: (value: number) => void;
	readOnly?: boolean;
	className?: string;
	children?: ReactNode;
};
export const Rating = ({
	value: controlledValue,
	onValueChange: controlledOnValueChange,
	defaultValue = 0,
	onChange,
	readOnly = false,
	className,
	children,
	...props
}: RatingProps) => {
	const [hoverValue, setHoverValue] = useState<number | null>(null);
	const [focusedStar, setFocusedStar] = useState<number | null>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const [value, onValueChange] = useControllableState({
		defaultProp: defaultValue,
		prop: controlledValue,
		onChange: controlledOnValueChange,
	});
	const handleValueChange = useCallback(
		(
			event:
				| MouseEvent<HTMLButtonElement>
				| KeyboardEvent<HTMLButtonElement>,
			newValue: number
		) => {
			if (!readOnly) {
				onChange?.(event, newValue);
				onValueChange?.(newValue);
			}
		},
		[readOnly, onChange, onValueChange]
	);
	const handleKeyDown = useCallback(
		(event: KeyboardEvent<HTMLButtonElement>) => {
			if (readOnly) {
				return;
			}

			const total = Children.count(children);
			const currentValue =
				focusedStar !== null ? focusedStar : (value ?? 0);
			const hasModifier = event.shiftKey || event.metaKey;

			const newValue = getNewValueFromKeyboard(
				event.key,
				currentValue,
				total,
				hasModifier
			);

			if (newValue === null) {
				return;
			}

			event.preventDefault();
			setFocusedStar(newValue);
			handleValueChange(event, newValue);
		},
		[focusedStar, value, children, readOnly, handleValueChange]
	);
	useEffect(() => {
		if (focusedStar !== null && containerRef.current) {
			const buttons = containerRef.current.querySelectorAll('button');
			buttons[focusedStar - 1]?.focus();
		}
	}, [focusedStar]);
	const contextValue: RatingContextValue = {
		value: value ?? 0,
		readOnly,
		hoverValue,
		focusedStar,
		handleValueChange,
		handleKeyDown,
		setHoverValue,
		setFocusedStar,
	};
	return (
		<RatingContext.Provider value={contextValue}>
			<div
				aria-label="Rating"
				className={cn('inline-flex items-center gap-0.5', className)}
				onMouseLeave={() => setHoverValue(null)}
				ref={containerRef}
				role="radiogroup"
				{...props}
			>
				{Children.map(children, (child, index) => {
					if (!child) {
						return null;
					}
					return cloneElement(
						child as ReactElement<RatingButtonProps>,
						{
							index,
						}
					);
				})}
			</div>
		</RatingContext.Provider>
	);
};
