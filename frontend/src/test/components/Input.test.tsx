import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Input from '../../components/Input';

describe('Input Component', () => {
  describe('rendering', () => {
    it('should render input field', () => {
      render(<Input placeholder="Enter text" />);
      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
    });

    it('should render with label', () => {
      render(<Input label="Email" />);
      expect(screen.getByText('Email')).toBeInTheDocument();
    });

    it('should show required asterisk when required', () => {
      render(<Input label="Email" required />);
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('should not show asterisk when not required', () => {
      render(<Input label="Email" />);
      expect(screen.queryByText('*')).not.toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('should display error message', () => {
      render(<Input error="This field is required" />);
      expect(screen.getByText('This field is required')).toBeInTheDocument();
    });

    it('should apply error styles', () => {
      render(<Input error="Invalid input" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('border-red-500');
    });

    it('should hide hint when error is present', () => {
      render(<Input hint="Helpful hint" error="Error message" />);
      expect(screen.queryByText('Helpful hint')).not.toBeInTheDocument();
      expect(screen.getByText('Error message')).toBeInTheDocument();
    });
  });

  describe('hint text', () => {
    it('should display hint text', () => {
      render(<Input hint="Enter your email address" />);
      expect(screen.getByText('Enter your email address')).toBeInTheDocument();
    });

    it('should show hint when no error', () => {
      render(<Input hint="Helpful hint" />);
      expect(screen.getByText('Helpful hint')).toBeInTheDocument();
    });
  });

  describe('disabled state', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<Input disabled />);
      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
    });

    it('should apply disabled styles', () => {
      render(<Input disabled />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('disabled:bg-gray-50', 'disabled:cursor-not-allowed');
    });
  });

  describe('input types', () => {
    it('should render text input by default', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      // Input without explicit type defaults to textbox role
      expect(input).toBeInTheDocument();
    });

    it('should render email input', () => {
      render(<Input type="email" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'email');
    });

    it('should render password input', () => {
      render(<Input type="password" />);
      const input = document.querySelector('input[type="password"]');
      expect(input).toBeInTheDocument();
    });

    it('should render number input', () => {
      render(<Input type="number" />);
      const input = screen.getByRole('spinbutton');
      expect(input).toHaveAttribute('type', 'number');
    });
  });

  describe('user interactions', () => {
    it('should handle onChange event', async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();
      
      render(<Input onChange={handleChange} />);
      const input = screen.getByRole('textbox');
      
      await user.type(input, 'test');
      expect(handleChange).toHaveBeenCalled();
      expect(input).toHaveValue('test');
    });

    it('should update value on user input', async () => {
      const user = userEvent.setup();
      
      render(<Input />);
      const input = screen.getByRole('textbox');
      
      await user.type(input, 'Hello World');
      expect(input).toHaveValue('Hello World');
    });

    it('should handle onBlur event', async () => {
      const handleBlur = vi.fn();
      const user = userEvent.setup();
      
      render(<Input onBlur={handleBlur} />);
      const input = screen.getByRole('textbox');
      
      await user.click(input);
      await user.tab();
      
      expect(handleBlur).toHaveBeenCalled();
    });

    it('should handle onFocus event', async () => {
      const handleFocus = vi.fn();
      const user = userEvent.setup();
      
      render(<Input onFocus={handleFocus} />);
      const input = screen.getByRole('textbox');
      
      await user.click(input);
      expect(handleFocus).toHaveBeenCalled();
    });
  });

  describe('custom className', () => {
    it('should apply custom className', () => {
      render(<Input className="custom-class" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('custom-class');
    });

    it('should preserve base classes with custom className', () => {
      render(<Input className="custom-class" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('custom-class', 'w-full', 'px-4');
    });
  });

  describe('HTML attributes', () => {
    it('should handle placeholder', () => {
      render(<Input placeholder="Enter your name" />);
      expect(screen.getByPlaceholderText('Enter your name')).toBeInTheDocument();
    });

    it('should handle name attribute', () => {
      render(<Input name="email" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('name', 'email');
    });

    it('should handle id attribute', () => {
      render(<Input id="email-input" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('id', 'email-input');
    });

    it('should handle maxLength attribute', () => {
      render(<Input maxLength={10} />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('maxLength', '10');
    });

    it('should handle min and max for number inputs', () => {
      render(<Input type="number" min={0} max={100} />);
      const input = screen.getByRole('spinbutton');
      expect(input).toHaveAttribute('min', '0');
      expect(input).toHaveAttribute('max', '100');
    });
  });

  describe('accessibility', () => {
    it('should render label text correctly', () => {
      render(<Input label="Email Address" id="email" />);
      expect(screen.getByText('Email Address')).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toHaveAttribute('id', 'email');
    });

    it('should support aria-label', () => {
      render(<Input aria-label="Search" />);
      const input = screen.getByLabelText('Search');
      expect(input).toBeInTheDocument();
    });

    it('should have proper focus styles', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-gray-900');
    });
  });

  describe('edge cases', () => {
    it('should handle empty string value', () => {
      render(<Input value="" onChange={() => {}} />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveValue('');
    });

    it('should handle very long text', async () => {
      const longText = 'a'.repeat(1000);
      const user = userEvent.setup();
      
      render(<Input />);
      const input = screen.getByRole('textbox');
      
      await user.type(input, longText);
      expect(input).toHaveValue(longText);
    });

    it('should handle special characters', () => {
      const specialText = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      
      render(<Input />);
      const input = screen.getByRole('textbox') as HTMLInputElement;
      
      // Use fireEvent for special characters since userEvent has issues with bracket chars
      fireEvent.change(input, { target: { value: specialText } });
      expect(input.value).toBe(specialText);
    });
  });
});
