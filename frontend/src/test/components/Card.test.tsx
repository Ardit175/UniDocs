import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Card from '../../components/Card';

describe('Card Component', () => {
  describe('rendering', () => {
    it('should render children content', () => {
      render(
        <Card>
          <p>Card content</p>
        </Card>
      );
      expect(screen.getByText('Card content')).toBeInTheDocument();
    });

    it('should render multiple children', () => {
      render(
        <Card>
          <h2>Title</h2>
          <p>Description</p>
        </Card>
      );
      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
    });

    it('should render with base styles', () => {
      const { container } = render(<Card>Content</Card>);
      const card = container.firstChild;
      expect(card).toHaveClass('bg-white', 'rounded-2xl', 'border', 'border-gray-100', 'shadow-sm');
    });
  });

  describe('hover effect', () => {
    it('should not have hover styles by default', () => {
      const { container } = render(<Card>Content</Card>);
      const card = container.firstChild;
      expect(card).not.toHaveClass('hover:shadow-md');
    });

    it('should apply hover styles when hover prop is true', () => {
      const { container } = render(<Card hover>Content</Card>);
      const card = container.firstChild;
      expect(card).toHaveClass('transition-all', 'duration-200', 'hover:shadow-md', 'hover:border-gray-200');
    });

    it('should not apply hover styles when hover prop is false', () => {
      const { container } = render(<Card hover={false}>Content</Card>);
      const card = container.firstChild;
      expect(card).not.toHaveClass('hover:shadow-md');
    });
  });

  describe('custom className', () => {
    it('should apply custom className', () => {
      const { container } = render(<Card className="custom-class">Content</Card>);
      const card = container.firstChild;
      expect(card).toHaveClass('custom-class');
    });

    it('should preserve base classes with custom className', () => {
      const { container } = render(<Card className="p-8">Content</Card>);
      const card = container.firstChild;
      expect(card).toHaveClass('p-8', 'bg-white', 'rounded-2xl');
    });

    it('should handle multiple custom classes', () => {
      const { container } = render(
        <Card className="p-4 m-2 max-w-md">Content</Card>
      );
      const card = container.firstChild;
      expect(card).toHaveClass('p-4', 'm-2', 'max-w-md');
    });
  });

  describe('content types', () => {
    it('should render text content', () => {
      render(<Card>Simple text</Card>);
      expect(screen.getByText('Simple text')).toBeInTheDocument();
    });

    it('should render complex nested components', () => {
      render(
        <Card>
          <div className="header">
            <h1>Title</h1>
            <button>Action</button>
          </div>
          <div className="body">
            <p>Body content</p>
          </div>
        </Card>
      );
      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
      expect(screen.getByText('Body content')).toBeInTheDocument();
    });

    it('should render with images', () => {
      render(
        <Card>
          <img src="/test.jpg" alt="Test" />
          <p>Caption</p>
        </Card>
      );
      expect(screen.getByRole('img', { name: 'Test' })).toBeInTheDocument();
      expect(screen.getByText('Caption')).toBeInTheDocument();
    });
  });

  describe('layout combinations', () => {
    it('should work with padding classes', () => {
      const { container } = render(
        <Card className="p-6">Content</Card>
      );
      const card = container.firstChild;
      expect(card).toHaveClass('p-6');
    });

    it('should work with margin classes', () => {
      const { container } = render(
        <Card className="m-4">Content</Card>
      );
      const card = container.firstChild;
      expect(card).toHaveClass('m-4');
    });

    it('should work with width constraints', () => {
      const { container } = render(
        <Card className="max-w-lg w-full">Content</Card>
      );
      const card = container.firstChild;
      expect(card).toHaveClass('max-w-lg', 'w-full');
    });
  });

  describe('edge cases', () => {
    it('should handle empty className', () => {
      const { container } = render(<Card className="">Content</Card>);
      const card = container.firstChild;
      expect(card).toHaveClass('bg-white', 'rounded-2xl');
    });

    it('should handle undefined className', () => {
      const { container } = render(<Card>Content</Card>);
      const card = container.firstChild;
      expect(card).toHaveClass('bg-white', 'rounded-2xl');
    });

    it('should render with empty content', () => {
      const { container } = render(<Card>{''}</Card>);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should handle null children gracefully', () => {
      const { container } = render(<Card>{null}</Card>);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should handle conditional children', () => {
      const showContent = true;
      render(
        <Card>
          {showContent && <p>Conditional content</p>}
          {!showContent && <p>Hidden content</p>}
        </Card>
      );
      expect(screen.getByText('Conditional content')).toBeInTheDocument();
      expect(screen.queryByText('Hidden content')).not.toBeInTheDocument();
    });
  });

  describe('semantic structure', () => {
    it('should render as a div element', () => {
      const { container } = render(<Card>Content</Card>);
      expect(container.firstChild?.nodeName).toBe('DIV');
    });

    it('should be accessible container', () => {
      render(
        <Card>
          <h2>Heading</h2>
          <p>Content</p>
        </Card>
      );
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toBeInTheDocument();
    });
  });
});
