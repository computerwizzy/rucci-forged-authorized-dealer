import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WheelDetailModal from '@/components/WheelDetailModal';
import { Wheel } from '@/types';

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img {...props} />,
}));

const WHEEL: Wheel = {
  name: 'Ace', series: '5 spoke', imageUrl: '/wheels/ace-1.png', slug: 'ace',
  detail: {
    images: [], specs: {}, gallery: [],
    variants: [
      { finish: 'Chrome', cap: 'Large cap', url: '/wheels/variants/ace-chromelargecap.png' },
      { finish: 'Chrome', cap: 'Small cap', url: '/wheels/variants/ace-chromesmallcap.png' },
      { finish: '24K Liquid', cap: 'Large cap', url: '/wheels/variants/ace-24kliquidlargecap.png' },
    ],
    vehicles: [{ url: '/wheels/vehicles/ace-chevrolet-impala-1.jpg', vehicle: 'Chevrolet Impala' }],
  },
};

const mainImg = () => screen.getByAltText(/Ace view 1/i) as HTMLImageElement;

test('shows the catalog photo until a finish is picked', () => {
  render(<WheelDetailModal wheel={WHEEL} onClose={jest.fn()} />);
  expect(screen.getByTestId('finish-picker')).toBeInTheDocument();
  expect(mainImg().src).toContain('/wheels/ace-1.png');
});

test('picking a finish swaps the main image and the cap toggle picks the matching render', async () => {
  render(<WheelDetailModal wheel={WHEEL} onClose={jest.fn()} />);
  await userEvent.click(screen.getByRole('button', { name: 'Chrome' }));
  expect(mainImg().src).toContain('ace-chromelargecap.png');
  await userEvent.click(screen.getByRole('button', { name: 'Small cap' }));
  expect(mainImg().src).toContain('ace-chromesmallcap.png');
  // a finish without a small-cap render falls back to whatever render it has
  await userEvent.click(screen.getByRole('button', { name: '24K Liquid' }));
  expect(mainImg().src).toContain('ace-24kliquidlargecap.png');
});

test('lists vehicle photos with the car named', () => {
  render(<WheelDetailModal wheel={WHEEL} onClose={jest.fn()} />);
  expect(screen.getByText('Chevrolet Impala')).toBeInTheDocument();
});

test('quote form opens pre-filled with the chosen finish', async () => {
  render(<WheelDetailModal wheel={WHEEL} onClose={jest.fn()} />);
  await userEvent.click(screen.getByRole('button', { name: '24K Liquid' }));
  await userEvent.click(screen.getByRole('button', { name: /get a quote/i }));
  expect(screen.getByLabelText(/^finish/i)).toHaveValue('24K Liquid');
  expect(screen.getByLabelText(/center cap/i)).toHaveValue('Large cap');
});

test('offers every standard finish even without a render, and prefills the quote with it', async () => {
  const plain: Wheel = { name: 'Plain', series: 'Other', imageUrl: '/wheels/plain-1.png', slug: 'plain', detail: { images: [], specs: {}, gallery: [] } };
  render(<WheelDetailModal wheel={plain} onClose={jest.fn()} />);
  const black = screen.getByRole('button', { name: /^Black/ });
  expect(black).toBeInTheDocument();
  await userEvent.click(black);
  expect((screen.getByAltText(/Plain view 1/i) as HTMLImageElement).src).toContain('/wheels/plain-1.png');
  expect(screen.getByText(/Black: built to order/i)).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: /get a quote/i }));
  expect(screen.getByLabelText(/^finish/i)).toHaveValue('Black');
});
