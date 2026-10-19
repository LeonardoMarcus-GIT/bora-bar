-- Bora Bar - "Aceito pedidos pelo WhatsApp" (bars.takes_whatsapp_orders)
-- Já aplicado no projeto em 19/10/2026. Só adiciona; não apaga nada.
-- true  = botão de WhatsApp mostra "Peça por aqui"
-- false = mostra "Tire suas dúvidas" (padrão)
-- O Bora Bar não recebe pedidos: só abre o WhatsApp do próprio estabelecimento.

alter table public.bars
add column if not exists takes_whatsapp_orders boolean not null default false;

grant update (takes_whatsapp_orders) on public.bars to authenticated;
