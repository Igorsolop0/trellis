import { render, screen } from '@testing-library/react';
import { Button } from './button';

describe('Button Component', () => {
    it('renders correctly', () => {
        render(<Button>Click me</Button>);
        expect(screen.getByText('Click me')).toBeInTheDocument();
    });

    it('handles click events', () => {
        const handleClick = jest.fn();
        render(<Button onClick={handleClick}>Click me</Button>);
        screen.getByText('Click me').click();
        expect(handleClick).toHaveBeenCalledTimes(1);
    });
});
