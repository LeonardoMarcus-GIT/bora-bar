import { LogIn, MessageSquare, Send, Star, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { fetchProfile } from "../services/profilesService.js";
import { createReview, deleteReview, fetchReviews } from "../services/reviewsService.js";

function formatDate(value) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

export default function Reviews({ barId }) {
  const { isAuthReady, user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [comment, setComment] = useState("");
  const [rating, setRating] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [profileName, setProfileName] = useState("");
  const reviewerName =
    profileName ||
    user?.user_metadata?.display_name ||
    user?.email?.split("@")[0] ||
    "sua conta";

  useEffect(() => {
    let isMounted = true;

    fetchReviews(barId).then((nextReviews) => {
      if (isMounted) {
        setReviews(nextReviews);
      }
    });

    setComment("");
    setRating(5);
    setFeedback("");

    return () => {
      isMounted = false;
    };
  }, [barId]);

  useEffect(() => {
    if (!user) {
      setProfileName("");
      return;
    }

    let isMounted = true;

    fetchProfile(user.id)
      .then((profile) => {
        if (isMounted) {
          setProfileName(profile?.display_name?.trim() ?? "");
        }
      })
      .catch(() => {
        if (isMounted) {
          setProfileName("");
        }
      });

    return () => {
      isMounted = false;
    };
  }, [user]);

  const averageRating = useMemo(() => {
    if (!reviews.length) {
      return null;
    }

    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    return (total / reviews.length).toFixed(1).replace(".", ",");
  }, [reviews]);

  async function handleSubmit(event) {
    event.preventDefault();

    const trimmedComment = comment.trim();

    if (!user) {
      window.location.hash = "login";
      return;
    }

    if (!trimmedComment) {
      return;
    }

    setIsSubmitting(true);
    setFeedback("");

    try {
      const nextReview = await createReview(barId, {
        author: reviewerName,
        comment: trimmedComment,
        rating
      }, user);

      setReviews((currentReviews) => [nextReview, ...currentReviews]);
      setComment("");
      setRating(5);
    } catch {
      setFeedback("Nao foi possivel enviar agora. Tente novamente em instantes.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(reviewId) {
    try {
      const nextReviews = await deleteReview(barId, reviewId);

      if (nextReviews) {
        setReviews(nextReviews);
        return;
      }

      setReviews((currentReviews) =>
        currentReviews.filter((review) => review.id !== reviewId)
      );
    } catch {
      setFeedback("Nao foi possivel remover agora. Tente novamente em instantes.");
    }
  }

  return (
    <section className="reviews-section">
      <div className="section-heading reviews-heading">
        <div>
          <p className="section-kicker">Opiniao da galera</p>
          <h2>Avaliacoes</h2>
        </div>
        <span>{averageRating ? `${averageRating} / 5` : "Sem notas"}</span>
      </div>

      <div className="reviews-layout">
        {isAuthReady && user ? (
          <form className="review-form" onSubmit={handleSubmit}>
            <p className="review-author-note">
              Avaliando como: <strong>{reviewerName}</strong>
            </p>

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
              <span>Comentario</span>
              <div className="field-with-icon textarea-field">
                <MessageSquare size={18} aria-hidden="true" />
                <textarea
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="O que voce achou do bar?"
                  required
                  rows={4}
                />
              </div>
            </label>

            <button
              className="submit-review"
              type="submit"
              disabled={isSubmitting}
            >
              <Send size={18} aria-hidden="true" />
              {isSubmitting ? "Enviando..." : "Enviar avaliacao"}
            </button>
            {feedback && <p className="form-feedback">{feedback}</p>}
          </form>
        ) : (
          <div className="review-login-card">
            <div className="review-login-icon">
              <MessageSquare size={22} aria-hidden="true" />
            </div>
            <div>
              <h3>Entre para deixar sua avaliacao</h3>
              <p>
                As opinioes ficam visiveis para todo mundo, mas so quem tem conta
                consegue comentar e dar nota.
              </p>
            </div>
            <button
              className="submit-review"
              type="button"
              onClick={() => {
                window.location.hash = "login";
              }}
            >
              <LogIn size={18} aria-hidden="true" />
              Entrar para avaliar
            </button>
            {feedback && <p className="form-feedback">{feedback}</p>}
          </div>
        )}

        <div className="review-list" aria-live="polite">
          {reviews.length ? (
            reviews.map((review) => (
              <article className="review-card" key={review.id}>
                <div className="review-card-header">
                  <div>
                    <strong>{review.author}</strong>
                    <span>{formatDate(review.createdAt)}</span>
                  </div>
                  {user?.id && review.userId === user.id && (
                    <button
                      className="delete-review"
                      type="button"
                      onClick={() => handleDelete(review.id)}
                      aria-label={`Remover avaliacao de ${review.author}`}
                      title="Remover avaliacao"
                    >
                      <Trash2 size={16} aria-hidden="true" />
                    </button>
                  )}
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
              <p>Ainda nao ha avaliacoes para este bar.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
