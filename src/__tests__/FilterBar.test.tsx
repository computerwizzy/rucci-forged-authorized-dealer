import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FilterBar from '@/components/FilterBar';

const WHEELS = [
  { name: 'A', series: 'Ecl', imageUrl: '/a.png', slug: 'a' },
  { name: 'B', series: 'Flat Forging', imageUrl: '/b.png', slug: 'b' },
];
const SERIES = ['Classics', 'Flow Forged', 'Signature'];

test('renders All button and one button per series', () => {
  render(<FilterBar wheels={WHEELS} series={SERIES} activeSeries="All" onChange={jest.fn()} />);
  expect(screen.getByRole('button', { name: /^All\b/ })).toBeInTheDocument();
  SERIES.forEach(s => expect(screen.getByRole('button', { name: new RegExp('^' + s + '\\b') })).toBeInTheDocument());
});

test('calls onChange with series name when clicked', async () => {
  const onChange = jest.fn();
  render(<FilterBar wheels={WHEELS} series={SERIES} activeSeries="All" onChange={onChange} />);
  await userEvent.click(screen.getByRole('button', { name: /^Classics\b/ }));
  expect(onChange).toHaveBeenCalledWith('Classics');
});

test('calls onChange with All when All button clicked', async () => {
  const onChange = jest.fn();
  render(<FilterBar wheels={WHEELS} series={SERIES} activeSeries="Classics" onChange={onChange} />);
  await userEvent.click(screen.getByRole('button', { name: /^All\b/ }));
  expect(onChange).toHaveBeenCalledWith('All');
});
