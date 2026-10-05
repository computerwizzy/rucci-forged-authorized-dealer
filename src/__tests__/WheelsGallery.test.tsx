import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WheelsGallery from '@/components/WheelsGallery';
import { Wheel } from '@/types';

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img {...props} />,
}));

jest.mock('@/components/WheelDetailModal', () => ({
  __esModule: true,
  default: ({ wheel, onClose }: { wheel: Wheel; onClose: () => void }) => (
    <div data-testid="detail-modal">
      <span>{wheel.name}</span>
      <button onClick={onClose}>Close</button>
    </div>
  ),
}));

const MOCK_WHEELS: Wheel[] = [
  { name: "D'Uno", series: 'Classics', imageUrl: 'https://forgiato.com/d-uno.jpg', slug: 'd-uno' },
  { name: 'D-Flow', series: 'Flow Forged', imageUrl: 'https://forgiato.com/d-flow.jpg', slug: 'd-flow' },
  { name: "D'Due", series: 'Classics', imageUrl: 'https://forgiato.com/d-due.jpg', slug: 'd-due' },
];

beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ wheels: MOCK_WHEELS }),
  });
});

test('shows loading state initially', () => {
  render(<WheelsGallery />);
  expect(screen.getByText(/loading/i)).toBeInTheDocument();
});

test('renders all wheels after fetch', async () => {
  render(<WheelsGallery />);
  await waitFor(() => {
    expect(screen.getByText("D'Uno")).toBeInTheDocument();
    expect(screen.getByText('D-Flow')).toBeInTheDocument();
    expect(screen.getByText("D'Due")).toBeInTheDocument();
  });
});

test('filters wheels by series when filter pill clicked', async () => {
  render(<WheelsGallery />);
  await waitFor(() => screen.getByText("D'Uno"));
  await userEvent.click(screen.getByRole('button', { name: /^Flow\ Forged\b/ }));
  expect(screen.getByText('D-Flow')).toBeInTheDocument();
  expect(screen.queryByText("D'Uno")).not.toBeInTheDocument();
});

test('opens detail modal when card clicked', async () => {
  render(<WheelsGallery />);
  await waitFor(() => screen.getByText("D'Uno"));
  await userEvent.click(screen.getAllByText(/view details/i)[0]);
  expect(screen.getByTestId('detail-modal')).toBeInTheDocument();
});
