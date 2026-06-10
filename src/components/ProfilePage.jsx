import { LogOut, Mail, MapPin, Save, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { signOut, updateUserMetadata } from "../services/authService.js";
import { fetchProfile, saveProfile } from "../services/profilesService.js";

export default function ProfilePage({ onLoginRequired, onSignedOut }) {
  const { isAuthReady, user } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [city, setCity] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState("");

  const initials = useMemo(() => {
    const fallback = user?.email?.slice(0, 2) ?? "BB";
    return (displayName || fallback)
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [displayName, user]);

  useEffect(() => {
    if (!isAuthReady) {
      return;
    }

    if (!user) {
      onLoginRequired();
      return;
    }

    let isMounted = true;
    setIsLoadingProfile(true);
    setFeedback("");
    setDisplayName(user.user_metadata?.display_name ?? "");
    setCity(user.user_metadata?.city ?? "");
    setNeighborhood(user.user_metadata?.neighborhood ?? "");

    fetchProfile(user.id)
      .then((profile) => {
        if (!isMounted) {
          return;
        }

        setDisplayName(profile?.display_name ?? user.user_metadata?.display_name ?? "");
        setCity(profile?.city ?? user.user_metadata?.city ?? "");
        setNeighborhood(
          profile?.neighborhood ?? user.user_metadata?.neighborhood ?? ""
        );
      })
      .catch(() => {
        console.warn("Perfil em tabela ainda indisponivel. Usando metadados do usuario.");
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingProfile(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isAuthReady, onLoginRequired, user]);

  async function handleSave(event) {
    event.preventDefault();
    setIsSaving(true);
    setFeedback("");

    try {
      const profile = {
        displayName: displayName.trim(),
        city: city.trim(),
        neighborhood: neighborhood.trim()
      };

      try {
        await saveProfile(user.id, profile);
      } catch {
        await updateUserMetadata({
          display_name: profile.displayName,
          city: profile.city,
          neighborhood: profile.neighborhood
        });
      }

      setFeedback("Perfil salvo.");
    } catch {
      setFeedback("Nao foi possivel salvar agora.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSignOut() {
    await signOut();
    onSignedOut();
  }

  if (!isAuthReady || isLoadingProfile) {
    return (
      <main className="account-page">
        <section className="empty-state">
          <h2>Carregando perfil</h2>
          <p>Estamos preparando sua conta.</p>
        </section>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="account-page">
      <section className="profile-panel">
        <div className="profile-summary">
          <div className="profile-avatar" aria-hidden="true">
            {initials}
          </div>
          <div>
            <p className="section-kicker">Perfil</p>
            <h1>{displayName || "Seu perfil"}</h1>
            <p>{user.email}</p>
          </div>
        </div>

        <form className="account-form" onSubmit={handleSave}>
          <label>
            <span>Nome ou apelido</span>
            <div className="field-with-icon">
              <UserRound size={18} aria-hidden="true" />
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Como voce quer aparecer"
              />
            </div>
          </label>

          <label>
            <span>Email</span>
            <div className="field-with-icon">
              <Mail size={18} aria-hidden="true" />
              <input value={user.email} disabled />
            </div>
          </label>

          <div className="profile-grid">
            <label>
              <span>Cidade</span>
              <div className="field-with-icon">
                <MapPin size={18} aria-hidden="true" />
                <input
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                  placeholder="Sao Paulo"
                />
              </div>
            </label>
            <label>
              <span>Bairro</span>
              <div className="field-with-icon">
                <MapPin size={18} aria-hidden="true" />
                <input
                  value={neighborhood}
                  onChange={(event) => setNeighborhood(event.target.value)}
                  placeholder="Pinheiros"
                />
              </div>
            </label>
          </div>

          <button className="primary-action" type="submit" disabled={isSaving}>
            <Save size={18} aria-hidden="true" />
            {isSaving ? "Salvando..." : "Salvar perfil"}
          </button>
          {feedback && <p className="form-feedback">{feedback}</p>}
        </form>

        <button className="secondary-action" type="button" onClick={handleSignOut}>
          <LogOut size={18} aria-hidden="true" />
          Sair da conta
        </button>
      </section>
    </main>
  );
}
