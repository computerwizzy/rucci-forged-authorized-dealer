import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WheelCard from '@/components/WheelCard';
import { Wheel } from '@/types';

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img {...props} />,
}));

const WHEEL: Wheel = {
  name: "D'Uno", series: 'Classics',
  imageUrl: 'https://forgiato.com/images/d-uno.jpg', slug: 'd-uno',
};

test('renders wheel name and series', () => {
  render(<WheelCard wheel={WHEEL} onDetailClick={jest.fn()} />);
  expect(screen.getByText("D'Uno")).toBeInTheDocument();
  expect(screen.getByText('Classics')).toBeInTheDocument();
});

test('renders wheel image with correct src', () => {
  render(<WheelCard wheel={WHEEL} onDetailClick={jest.fn()} />);
  expect(screen.getByRole('img')).toHaveAttribute('src', WHEEL.imageUrl);
});

test('calls onDetailClick with wheel when card clicked', async () => {
  const onDetailClick = jest.fn();
  render(<WheelCard wheel={WHEEL} onDetailClick={onDetailClick} />);
  await userEvent.click(screen.getByText(/view details/i));
  expect(onDetailClick).toHaveBeenCalledWith(WHEEL);
});
