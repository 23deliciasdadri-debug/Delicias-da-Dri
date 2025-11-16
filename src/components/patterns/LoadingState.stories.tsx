import type { Meta, StoryObj } from '@storybook/react';
import LoadingState from './LoadingState';

const meta: Meta<typeof LoadingState> = {
  title: 'Patterns/LoadingState',
  component: LoadingState,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    message: { control: 'text' },
    inline: { control: 'boolean' },
  },
};

export default meta;

type Story = StoryObj<typeof LoadingState>;

export const Default: Story = {
  args: {
    message: 'Carregando dados...',
  },
};

export const Inline: Story = {
  args: {
    message: 'Sincronizando pedidos',
    inline: true,
  },
};
