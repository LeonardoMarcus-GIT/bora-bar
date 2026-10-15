import { useState } from "react";
import { ChefHat, ImagePlus, Plus, RefreshCw, Trash2 } from "lucide-react";
import { uploadBusinessCoverImage } from "../services/businessImageService.js";

// Editor da aba "Pratos do dia" no painel do dono.
// Cada prato tem foto (obrigatória), nome (obrigatório), preço e descrição.
// A lista é salva inteira pelo botão "Salvar" do painel (replace_bar_gallery).

export const MAX_DISHES = 12;

let localIdCounter = 0;

function newDish(url) {
  localIdCounter += 1;
  return {
    id: `new-dish-${Date.now()}-${localIdCounter}`,
    url,
    name: "",
    description: "",
    price: ""
  };
}

function uploadErrorMessage(error) {
  if (error?.message === "INVALID_IMAGE_TYPE") {
    return "Escolha uma imagem JPG, PNG ou WebP.";
  }

  if (error?.message === "IMAGE_TOO_LARGE") {
    return "A imagem deve ter no máximo 8 MB.";
  }

  return "Não foi possível enviar a foto agora. Tente novamente.";
}

export default function DishesEditor({ barId, dishes, onChange, onFeedback }) {
  const [uploadingId, setUploadingId] = useState("");

  async function uploadPhoto(file) {
    return uploadBusinessCoverImage(barId, file);
  }

  async function handleAddDish(event) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    setUploadingId("new");
    onFeedback("");

    try {
      const url = await uploadPhoto(file);
      onChange([...dishes, newDish(url)]);
      onFeedback("Foto enviada. Escreva o nome do prato e toque em Salvar.");
    } catch (error) {
      onFeedback(uploadErrorMessage(error));
    } finally {
      setUploadingId("");
    }
  }

  async function handleReplacePhoto(dishId, event) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    setUploadingId(dishId);
    onFeedback("");

    try {
      const url = await uploadPhoto(file);
      updateDish(dishId, { url });
      onFeedback("Foto trocada. Toque em Salvar para publicar.");
    } catch (error) {
      onFeedback(uploadErrorMessage(error));
    } finally {
      setUploadingId("");
    }
  }

  function updateDish(dishId, patch) {
    onChange(dishes.map((dish) => (dish.id === dishId ? { ...dish, ...patch } : dish)));
  }

  function removeDish(dishId) {
    onChange(dishes.filter((dish) => dish.id !== dishId));
  }

  function moveDish(index, direction) {
    const target = index + direction;

    if (target < 0 || target >= dishes.length) {
      return;
    }

    const next = [...dishes];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  const canAdd = dishes.length < MAX_DISHES;

  return (
    <div className="business-editor dishes-editor">
      <p className="business-muted">
        Mostre o que sai da cozinha hoje. Cada prato aparece com foto, nome e
        preço na sua página. Troque sempre que o cardápio do dia mudar.
      </p>

      {dishes.length === 0 && (
        <div className="dishes-empty">
          <ChefHat size={28} aria-hidden="true" />
          <p>Nenhum prato do dia ainda. Comece enviando uma foto.</p>
        </div>
      )}

      <div className="dishes-list">
        {dishes.map((dish, index) => (
          <article className="dish-editor-card" key={dish.id}>
            <div className="dish-editor-photo">
              <img src={dish.url} alt={dish.name || "Foto do prato"} />
              <label className="dish-photo-button">
                <RefreshCw size={15} aria-hidden="true" />
                {uploadingId === dish.id ? "Enviando..." : "Trocar foto"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={Boolean(uploadingId)}
                  onChange={(event) => handleReplacePhoto(dish.id, event)}
                />
              </label>
            </div>

            <div className="dish-editor-fields">
              <label>
                <span>Nome do prato</span>
                <input
                  value={dish.name}
                  maxLength={80}
                  onChange={(event) => updateDish(dish.id, { name: event.target.value })}
                  placeholder="Ex: Bacalhau com legumes"
                />
              </label>

              <label className="menu-price-field dish-price-field">
                <span className="sr-only">Preço do prato</span>
                <b aria-hidden="true">R$</b>
                <input
                  aria-label="Preço do prato"
                  type="number"
                  min="0"
                  step="0.01"
                  value={dish.price}
                  onChange={(event) => updateDish(dish.id, { price: event.target.value })}
                  placeholder="0,00 (opcional)"
                />
              </label>

              <label>
                <span>Descrição (opcional)</span>
                <input
                  value={dish.description}
                  maxLength={200}
                  onChange={(event) =>
                    updateDish(dish.id, { description: event.target.value })
                  }
                  placeholder="Ex: Acompanha arroz, batatas e salada"
                />
              </label>

              <div className="dish-editor-actions">
                <button
                  type="button"
                  onClick={() => moveDish(index, -1)}
                  disabled={index === 0}
                  aria-label={`Subir ${dish.name || "prato"}`}
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveDish(index, 1)}
                  disabled={index === dishes.length - 1}
                  aria-label={`Descer ${dish.name || "prato"}`}
                >
                  ↓
                </button>
                <button
                  className="icon-delete"
                  type="button"
                  onClick={() => removeDish(dish.id)}
                  aria-label={`Remover ${dish.name || "prato"}`}
                >
                  <Trash2 size={17} aria-hidden="true" />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {canAdd ? (
        <label className="business-add-button dish-add-button">
          {uploadingId === "new" ? (
            "Enviando foto..."
          ) : (
            <>
              <ImagePlus size={17} aria-hidden="true" />
              Adicionar prato com foto
            </>
          )}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={Boolean(uploadingId)}
            onChange={handleAddDish}
          />
        </label>
      ) : (
        <p className="business-muted">
          <Plus size={14} aria-hidden="true" /> Limite de {MAX_DISHES} pratos. Remova um para adicionar outro.
        </p>
      )}
    </div>
  );
}
