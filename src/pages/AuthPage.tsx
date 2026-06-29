import { useState } from 'react'
import type { FormEvent } from 'react'
import { api, CountrySelect, go, PageHero, PhoneField, phone } from '../shared'
import type { Account, Toast } from '../shared'

type LoginStartResponse = { email: string; message: string; codePreview?: string }

export function AuthPage({
  account,
  setAccount,
  notify,
}: {
  account: Account | null
  setAccount: (a: Account) => void
  notify: (k: Toast['kind'], t: string) => void
}) {
  const [verificationEmail, setVerificationEmail] = useState(account?.email ?? '')
  const [loginEmail, setLoginEmail] = useState(account?.email ?? '')
  const [loginCodeSent, setLoginCodeSent] = useState(false)

  async function register(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    try {
      const acc = await api<Account>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          fullName: fd.get('fullName'),
          email: fd.get('email'),
          phone: phone(fd, 'phone'),
          whatsappNumber: phone(fd, 'whatsappNumber'),
          role: fd.get('role'),
          payoutMethod: fd.get('payoutMethod'),
          payoutCountry: fd.get('payoutCountry'),
          payoutAccountName: fd.get('payoutAccountName'),
          payoutAccountRef: fd.get('payoutAccountRef'),
        }),
      })
      setVerificationEmail(acc.email)
      notify(acc.codePreview ? 'info' : 'success', acc.codePreview ? `Compte créé. Email indisponible pour le moment — code de test: ${acc.codePreview}` : (acc.message || 'Compte créé. Un code de vérification a été envoyé par email.'))
    } catch (e: any) {
      notify('error', `Création échouée: ${e.message}`)
    }
  }

  async function verify(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    try {
      const acc = await api<Account>('/auth/verify', {
        method: 'POST',
        body: JSON.stringify({ channel: 'email', destination: fd.get('destination'), code: fd.get('code') }),
      })
      setAccount(acc)
      notify('success', 'Compte vérifié. Connexion réussie.')
      go('/')
    } catch (e: any) {
      notify('error', `Vérification échouée: ${e.message}`)
    }
  }

  async function requestLoginCode(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const email = String(fd.get('email') || '').trim()
    try {
      const res = await api<LoginStartResponse>('/auth/login/request-code', {
        method: 'POST',
        body: JSON.stringify({ email }),
      })
      setLoginEmail(res.email)
      setLoginCodeSent(true)
      notify(res.codePreview ? 'info' : 'success', res.codePreview ? `Email indisponible pour le moment — code de test: ${res.codePreview}` : (res.message || 'Code de connexion envoyé par email.'))
    } catch (e: any) {
      setLoginCodeSent(false)
      notify('error', `Connexion échouée: ${e.message}`)
    }
  }

  async function verifyLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    try {
      const acc = await api<Account>('/auth/login/verify', {
        method: 'POST',
        body: JSON.stringify({ email: fd.get('email'), code: fd.get('code') }),
      })
      setAccount(acc)
      notify('success', 'Connexion réussie.')
      go('/')
    } catch (e: any) {
      notify('error', `Connexion échouée: ${e.message}`)
    }
  }

  return (
    <main>
      <PageHero
        title="Connexion & vérification"
        text="Créez votre compte ou connectez-vous avec un code reçu par email. Après validation, vous serez redirigé vers l’accueil."
      />
      <section className="authGrid page">
        <form className="form panel" onSubmit={register}>
          <h2>Créer compte</h2>
          <input name="fullName" placeholder="Nom complet" required />
          <input name="email" type="email" placeholder="Email réel" required />
          <PhoneField base="phone" label="Téléphone SMS" />
          <PhoneField base="whatsappNumber" label="WhatsApp" />
          <select name="role">
            <option>ORGANIZER</option>
            <option>PARTICIPANT</option>
          </select>
          <select name="payoutMethod">
            <option>PAYPAL</option>
            <option>BANK_TRANSFER</option>
          </select>
          <CountrySelect name="payoutCountry" />
          <input name="payoutAccountName" placeholder="Nom compte reversement" />
          <input name="payoutAccountRef" placeholder="Email PayPal ou IBAN" />
          <button className="primary">Créer et recevoir le code</button>
        </form>

        <div className="panel form">
          <form className="form" onSubmit={verify}>
            <h2>Valider le compte créé</h2>
            <input
              name="destination"
              type="email"
              placeholder="Email du compte"
              value={verificationEmail}
              onChange={(e) => setVerificationEmail(e.target.value)}
              required
            />
            <input name="code" placeholder="Code reçu par email" required />
            <button className="primary">Valider et aller à l’accueil</button>
          </form>

          <form className="form" onSubmit={requestLoginCode}>
            <h2>Se connecter</h2>
            <input
              name="email"
              type="email"
              placeholder="Email du compte"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              required
            />
            <button className="primary">Recevoir le code</button>
          </form>

          {loginCodeSent && (
            <form className="form" onSubmit={verifyLogin}>
              <h2>Entrer le code</h2>
              <input name="email" type="email" value={loginEmail} readOnly required />
              <input name="code" placeholder="Code reçu par email" autoFocus required />
              <button className="primary">Valider la connexion</button>
            </form>
          )}
        </div>
      </section>
    </main>
  )
}
