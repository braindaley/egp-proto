import { render, screen } from '@testing-library/react';

// Simple test to verify the testing setup works
describe('Test Setup Verification', () => {
  it('should render a simple component', () => {
    const TestComponent = () => <div>Hello Test World</div>;
    render(<TestComponent />);
    expect(screen.getByText('Hello Test World')).toBeInTheDocument();
  });

  it('should handle basic interactions', () => {
    const TestComponent = () => (
      <button onClick={() => {}}>Click me</button>
    );
    render(<TestComponent />);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('should verify jest setup', () => {
    expect(1 + 1).toBe(2);
    expect('hello').toBe('hello');
  });
});