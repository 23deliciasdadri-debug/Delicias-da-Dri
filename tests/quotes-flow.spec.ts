import { test, expect } from '@playwright/test';

const baseUrl = process.env.PLAYWRIGHT_BASE_URL;
const storybookUrl = process.env.PLAYWRIGHT_STORYBOOK_URL;
const publicPreviewUrl = process.env.PLAYWRIGHT_PUBLIC_PREVIEW_URL;
const editClientFilter = process.env.PLAYWRIGHT_EDIT_QUOTE_CLIENT;

test.describe('Quote flows', () => {
  test('render QuotePreview via Storybook', async ({ page }) => {
    test.skip(!storybookUrl, 'Configure PLAYWRIGHT_STORYBOOK_URL apontando para o Storybook rodando.');
    await page.goto(`${storybookUrl!}?path=/story/features-quotepreview--pending`);
    await expect(page.getByText('Resumo financeiro', { exact: false })).toBeVisible();
    await expect(page.getByText('Quantidade de itens', { exact: false })).toBeVisible();
  });

  test('aprovar orçamento pelo link público', async ({ page }) => {
    test.skip(!publicPreviewUrl, 'Defina PLAYWRIGHT_PUBLIC_PREVIEW_URL com um token válido gerado pelo app.');
    await page.goto(publicPreviewUrl!);
    await expect(page.getByText('Visualizacao de Orcamento', { exact: false })).toBeVisible();
    const approveButton = page.getByRole('button', { name: /Aprovar orcamento/i });
    if (await approveButton.isVisible()) {
      await approveButton.click();
      await expect(page.getByText('Orcamento aprovado com sucesso', { exact: false })).toBeVisible();
    } else {
      await expect(page.getByText('Este orcamento foi aprovado', { exact: false })).toBeVisible();
    }
  });

  test('editar orçamento pelo dashboard', async ({ page }) => {
    test.skip(!baseUrl || !editClientFilter, 'Informe PLAYWRIGHT_BASE_URL e PLAYWRIGHT_EDIT_QUOTE_CLIENT para filtrar um orçamento editável.');
    await page.goto(`${baseUrl!}/orcamentos`);
    const searchInput = page.getByPlaceholder('Ex.: Maria, (11) 9...');
    await searchInput.fill(editClientFilter!);
    await page.waitForTimeout(700);
    const trigger = page.getByTestId('quote-actions-trigger').first();
    await trigger.click();
    await page.getByTestId('quote-action-details').click();
    await expect(page.getByText('Resumo do or', { exact: false })).toBeVisible();
    const editButton = page.getByRole('button', { name: /Editar or/ });
    await expect(editButton).toBeVisible();
    if (await editButton.isEnabled()) {
      await editButton.click();
      await expect(page.getByText('Editar or', { exact: false })).toBeVisible();
      await expect(page.getByRole('button', { name: /Salvar/ })).toBeVisible();
    }
  });
});
