import { isSupabaseConfigured, supabase } from "./supabaseClient.js";

function getStorageKey(barId) {
  return `bora-bar-reviews:${barId}`;
}

function mapReviewFromDatabase(review) {
  return {
    id: review.id,
    userId: review.user_id,
    author: review.author,
    comment: review.comment,
    createdAt: review.created_at,
    rating: review.rating
  };
}

function readStoredReviews(barId) {
  try {
    return JSON.parse(localStorage.getItem(getStorageKey(barId))) ?? [];
  } catch {
    return [];
  }
}

function saveStoredReviews(barId, reviews) {
  try {
    localStorage.setItem(getStorageKey(barId), JSON.stringify(reviews));
  } catch {
    // Se o navegador bloquear armazenamento local, mantemos apenas o estado em tela.
  }
}

export async function fetchReviews(barId) {
  if (!isSupabaseConfigured) {
    return readStoredReviews(barId);
  }

  const { data, error } = await supabase
    .from("reviews")
    .select("id, bar_id, user_id, author, comment, rating, created_at")
    .eq("bar_id", barId)
    .order("created_at", { ascending: false });

  if (error) {
    console.warn("Nao foi possivel carregar avaliacoes do Supabase.", error);
    return readStoredReviews(barId);
  }

  return data.map(mapReviewFromDatabase);
}

export async function createReview(barId, review, user) {
  if (!user) {
    throw new Error("LOGIN_REQUIRED");
  }

  const localReview = {
    ...review,
    id: crypto.randomUUID(),
    userId: user.id,
    author: review.author,
    createdAt: new Date().toISOString()
  };

  if (!isSupabaseConfigured) {
    const nextReviews = [localReview, ...readStoredReviews(barId)];
    saveStoredReviews(barId, nextReviews);
    return localReview;
  }

  const { data, error } = await supabase
    .from("reviews")
    .insert({
      bar_id: barId,
      comment: review.comment,
      rating: review.rating
    })
    .select("id, bar_id, user_id, author, comment, rating, created_at")
    .single();

  if (error) {
    console.warn("Nao foi possivel salvar avaliacao no Supabase.", error);
    throw error;
  }

  return mapReviewFromDatabase(data);
}

export async function deleteReview(barId, reviewId) {
  if (isSupabaseConfigured) {
    const { error } = await supabase.from("reviews").delete().eq("id", reviewId);

    if (error) {
      console.warn("Nao foi possivel remover avaliacao no Supabase.", error);
      throw error;
    }

    return null;
  }

  const nextReviews = readStoredReviews(barId).filter(
    (review) => review.id !== reviewId
  );

  saveStoredReviews(barId, nextReviews);
  return nextReviews;
}
