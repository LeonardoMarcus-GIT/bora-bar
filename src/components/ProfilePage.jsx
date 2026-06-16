import { LogOut, Mail, Save, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import AddressFields from "./AddressFields.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import {
  emptyAddress,
  geocodeAddress,
  normalizeAddress,
  toProfilePayload
} from "../services/addressService.js";
import { signOut, updateUserMetadata } from "../services/authService.js";
import { fetchProfile, saveProfile } from "../services/profilesService.js";

export default function ProfilePage({ onLoginRequired, onSaved, onSignedOut }) {
  const { isAuthReady, session, user } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [address, setAddress] = useState(emptyAddress);
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
    setAddress(
      normalizeAddress({
        city: user.user_metadata?.city,
        cityIbgeCode: user.user_metadata?.city_ibge_code,
        latitude: user.user_metadata?.latitude,
        locationSource: user.user_metadata?.location_source,
        locationUpdatedAt: user.user_metadata?.location_updated_at,
        longitude: user.user_metadata?.longitude,
        neighborhood: user.user_metadata?.neighborhood,
        postalCode: user.user_metadata?.postal_code,
        state: user.user_metadata?.state,
        stateCode: user.user_metadata?.state_code
      })
    );

    fetchProfile(user.id)
      .then((profile) => {
        if (!isMounted) {
          return;
        }

        setDisplayName(profile?.display_name ?? user.user_metadata?.display_name ?? "");
        setAddress(
          normalizeAddress({
            ...profile,
            cityIbgeCode:
              profile?.city_ibge_code ?? user.user_metadata?.city_ibge_code,
            locationSource:
              profile?.location_source ?? user.user_metadata?.location_source,
            locationUpdatedAt:
              profile?.location_updated_at ??
              user.user_metadata?.location_updated_at,
            postalCode: profile?.postal_code ?? user.user_metadata?.postal_code,
            stateCode: profile?.state_code ?? user.user_metadata?.state_code
          })
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
      let profile = {
        displayName: displayName.trim(),
        ...toProfilePayload(address)
      };

      try {
        const { location } = await geocodeAddress(
          profile,
          session?.access_token
        );
        profile = {
          ...profile,
          latitude: location?.latitude ?? profile.latitude,
          locationSource: location?.source ?? profile.locationSource,
          locationUpdatedAt: location?.updatedAt ?? profile.locationUpdatedAt,
          longitude: location?.longitude ?? profile.longitude
        };
        setAddress(normalizeAddress(profile));
      } catch {
        // O perfil ainda pode ser salvo sem coordenada aproximada.
      }

      try {
        await saveProfile(user.id, profile);
      } catch {
        await updateUserMetadata({
          display_name: profile.displayName,
          city: profile.city,
          city_ibge_code: profile.cityIbgeCode,
          latitude: profile.latitude,
          location_source: profile.locationSource,
          location_updated_at: profile.locationUpdatedAt,
          longitude: profile.longitude,
          neighborhood: profile.neighborhood,
          postal_code: profile.postalCode,
          state: profile.state,
          state_code: profile.stateCode
        });
      }

      setFeedback("Perfil salvo.");
      window.dispatchEvent(
        new CustomEvent("bora-bar-profile-updated", {
          detail: { profile }
        })
      );
      onSaved?.();
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

          <AddressFields address={address} onChange={setAddress} />

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
