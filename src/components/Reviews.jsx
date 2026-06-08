import { MessageSquare, Send, Star, Trash2, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

function readStoredReviews(barId) {
  try {
    return JSON.parse(localStorage.getItem(`bora-bar-reviews:${barId}`)) ?? [];
  } catch {
    return [];
  }
}

function saveStoredReviews(barId, reviews) {
  localStorage.setItem(`bora-bar-reviews:${barId}`, JSON.stringify(reviews));
}

function formatDate(value) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

export default function Reviews({ barId }) {
  const [reviews, setReviews] = useState(() => readStoredReviews(barId));
  const [author, setAuthor] = useState("");
  const [comment, setComment] = useState("");
  const [rating, setRating] = useState(5);

  useEffect(() => {
    setReviews(readStoredReviews(barId));
    setAuthor("");
    setComment("");
    setRating(5);
  }, [barId]);

  const averageRating = useMemo(() => {
    if (!reviews.length) {
      return null;
    }

    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    return (total / reviews.length).toFixed(1).replace(".", ",");
  }, [reviews]);

  function handleSubmit(event) {
    event.preventDefault();

    const trimmedAuthor = author.trim();
    const trimmedComment = comment.trim();

    if (!trimmedAuthor || !trimmedComment) {
      return;
    }

    const nextReview = {
      id: crypto.randomUUID(),
      author: trimmedAuthor,
      comment: trimmedComment,
      createdAt: new Date().toISOString(),
      rating
    };
    const nextReviews = [nextReview, ...reviews];

    setReviews(nextReviews);
    saveStoredReviews(barId, nextReviews);
    setAuthor("");
    setComment("");
    setRating(5);
  }

  function handleDelete(reviewId) {
    const nextReviews = reviews.filter((review) => review.id !== reviewId);

    setReviews(nextReviews);
    saveStoredReviews(barId, nextReviews);
  }

  return (
    <section className="reviews-section">
      <div className="section-heading reviews-heading">
        <div>
          <p className="section-kicker">Opinião da galera</p>
          <h2>Avaliações</h2>
        </div>
        <span>{averageRating ? `${averageRating} / 5` : "Sem notas"}</span>
      </div>

      <div className="reviews-layout">
        <form className="review-form" onSubmit={handleSubmit}>
          <label>
            <span>Seu nome ou apelido</span>
            <div className="field-with-icon">
              <UserRound size={18} aria-hidden="true" />
              <input
                type="text"
                value={author}
                onChange={(event) => setAuthor(event.target.value)}
                placeholder="Ex: Ana"
                required
              />
            </div>
          </label>

          <fieldset className="rating-field">
            <legend>Nota</legend>
            <div className="rating-buttons">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  className={`star-button ${value <= rating ? "is-selected" : ""}`}
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  aria-label={`${value} estrela${value > 1 ? "s" : ""}`}
                  aria-pressed={value === rating}
                  title={`${value} estrela${value > 1 ? "s" : ""}`}
                >
                  <Star size={22} aria-hidden="true" />
                </button>
              ))}
            </div>
          </fieldset>

          <label>
            <span>Comentário</span>
            <div className="field-with-icon textarea-field">
              <MessageSquare size={18} aria-hidden="true" />
              <textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="O que você achou do bar?"
                required
                rows={4}
              />
            </div>
          </label>

          <button className="submit-review" type="submit">
            <Send size={18} aria-hidden="true" />
            Enviar avaliação
          </button>
        </form>

        <div className="review-list" aria-live="polite">
          {reviews.length ? (
            reviews.map((review) => (
              <article className="review-card" key={review.id}>
                <div className="review-card-header">
                  <div>
                    <strong>{review.author}</strong>
                    <span>{formatDate(review.createdAt)}</span>
                  </div>
                  <button
                    className="delete-review"
                    type="button"
                    onClick={() => handleDelete(review.id)}
                    aria-label={`Remover avaliação de ${review.author}`}
                    title="Remover avaliação"
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                </div>
                <div className="review-stars" aria-label={`${review.rating} de 5`}>
                  {[1, 2, 3, 4, 5].map((value) => (
                    <Star
                      className={value <= review.rating ? "is-filled" : ""}
                      key={value}
                      size={16}
                      aria-hidden="true"
                    />
                  ))}
                </div>
                <p>{review.comment}</p>
              </article>
            ))
          ) : (
            <div className="review-empty">
              <MessageSquare size={22} aria-hidden="true" />
              <p>Ainda não há avaliações para este bar.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
