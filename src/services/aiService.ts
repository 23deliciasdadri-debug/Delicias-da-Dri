import { supabase } from '../lib/supabaseClient';

/**
 * Serviço para integração com IA.
 * Gera imagens de bolos personalizados baseado nas escolhas do usuário.
 */

interface CakeChoices {
    format: string;
    size: string;
    flavor: string;
    fillings: string[];
    covering: string;
    theme: string;
    color: string;
    message?: string;
}

/**
 * Traduz os IDs das escolhas para português legível
 */
const TRANSLATIONS: Record<string, Record<string, string>> = {
    format: {
        redondo: 'redondo',
        quadrado: 'quadrado',
        coracao: 'em formato de coração',
        numero: 'em formato de número ou letra',
    },
    covering: {
        chantilly: 'chantilly',
        buttercream: 'buttercream',
        ganache: 'ganache de chocolate',
        'pasta-americana': 'pasta americana',
        naked: 'naked cake (sem cobertura)',
        glacê: 'glacê',
    },
    color: {
        branco: 'branco',
        rosa: 'rosa',
        azul: 'azul',
        verde: 'verde',
        amarelo: 'amarelo',
        laranja: 'laranja',
        roxo: 'roxo',
        vermelho: 'vermelho',
        chocolate: 'marrom chocolate',
    },
};

/**
 * Constrói o prompt para geração da imagem de bolo
 */
export function buildCakePrompt(choices: CakeChoices): string {
    const format = TRANSLATIONS.format[choices.format] || choices.format;
    const covering = TRANSLATIONS.covering[choices.covering] || choices.covering;
    const color = TRANSLATIONS.color[choices.color] || choices.color;

    const fillings = choices.fillings.join(', ');

    let prompt = `Um lindo bolo artesanal ${format} com cobertura de ${covering} na cor ${color}.`;

    if (choices.theme) {
        prompt += ` Tema: ${choices.theme}.`;
    }

    if (choices.message) {
        prompt += ` Com a mensagem "${choices.message}" escrita no bolo.`;
    }

    prompt += ` Recheio de ${fillings}. O bolo está em uma mesa elegante com iluminação suave de estúdio. Fotografia profissional de confeitaria, alta qualidade, apetitoso e convidativo.`;

    return prompt;
}

/**
 * Gera imagem de bolo usando a API Gemini
 */
export async function generateCakeImage(choices: CakeChoices): Promise<{
    imageUrl: string | null;
    error: string | null;
}> {
    try {
        const prompt = buildCakePrompt(choices);

        // Verificar se a API key está configurada
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey) {
            console.warn('API Key Gemini não configurada, usando placeholder');
            // Retornar URL de placeholder para desenvolvimento
            return {
                imageUrl: `https://placehold.co/800x800/F472B6/FFFFFF?text=Bolo+${choices.theme?.substring(0, 20) || 'Personalizado'}`,
                error: null,
            };
        }

        // Chamada para API Gemini (Imagen)
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `Generate a photorealistic image of: ${prompt}`
                        }]
                    }],
                    generationConfig: {
                        responseModalities: ["TEXT", "IMAGE"]
                    }
                }),
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Erro na API Gemini:', errorText);
            throw new Error('Erro ao gerar imagem');
        }

        const data = await response.json();

        // Extrair imagem da resposta
        const parts = data.candidates?.[0]?.content?.parts || [];
        const imagePart = parts.find((p: any) => p.inlineData?.mimeType?.startsWith('image/'));

        if (imagePart?.inlineData?.data) {
            // Converter base64 para data URL
            const mimeType = imagePart.inlineData.mimeType;
            const imageUrl = `data:${mimeType};base64,${imagePart.inlineData.data}`;
            return { imageUrl, error: null };
        }

        // Fallback para placeholder se não gerou imagem
        return {
            imageUrl: `https://placehold.co/800x800/F472B6/FFFFFF?text=Bolo+Personalizado`,
            error: null,
        };
    } catch (error) {
        console.error('Erro ao gerar imagem:', error);
        return {
            imageUrl: null,
            error: error instanceof Error ? error.message : 'Erro desconhecido ao gerar imagem',
        };
    }
}

/**
 * Salva a criação do bolo no banco de dados
 */
export async function saveCakeCreation(params: {
    clientId: string;
    choices: CakeChoices;
    imageUrl: string;
    estimatedPrice: number;
}): Promise<{ id: string | null; error: string | null }> {
    try {
        const { data, error } = await supabase
            .from('cake_creations')
            .insert({
                client_id: params.clientId,
                choices: params.choices,
                generated_image_url: params.imageUrl,
                estimated_price: params.estimatedPrice,
            })
            .select('id')
            .single();

        if (error) {
            console.error('Erro ao salvar criação:', error);
            return { id: null, error: error.message };
        }

        return { id: data.id, error: null };
    } catch (error) {
        console.error('Erro inesperado:', error);
        return { id: null, error: 'Erro ao salvar criação' };
    }
}

/**
 * Calcula o preço estimado do bolo baseado nas escolhas
 */
export function calculateCakePrice(choices: CakeChoices): number {
    // Preços base por tamanho
    const sizePrice: Record<string, number> = {
        individual: 25,
        p: 80,
        m: 120,
        g: 180,
        gg: 250,
    };

    // Preço dos recheios (soma)
    const fillingPrice: Record<string, number> = {
        brigadeiro: 15,
        ninho: 15,
        morango: 20,
        nutella: 25,
        'doce-de-leite': 15,
        maracuja: 18,
        limao: 18,
        coco: 15,
    };

    let total = sizePrice[choices.size] || 100;

    // Adicionar preço dos recheios
    choices.fillings.forEach((f) => {
        total += fillingPrice[f] || 15;
    });

    // Adicional para formatos especiais
    if (choices.format === 'coracao' || choices.format === 'numero') {
        total += 30;
    }

    // Adicional para coberturas premium
    if (choices.covering === 'pasta-americana') {
        total += 40;
    } else if (choices.covering === 'ganache') {
        total += 20;
    }

    return total;
}
