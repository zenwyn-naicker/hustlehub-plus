import React from 'react';

export default function PublicHome({ onSignIn, onRegister }) {
  return (
    <div className="public-home">
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="live-dot" /> THE FREELANCE MARKETPLACE
          </p>
          <h1 id="hero-title">
            The right skills.
            <br />
            <span>A fresh start.</span>
          </h1>
          <p className="hero-description">
            Bring a project to life. Put your skills to work. Find your next
            opportunity on HustleHub+.
          </p>
          <div className="actions hero-actions">
            <button onClick={() => onRegister('client')}>Get started</button>
            <button
              className="secondary"
              aria-label="Sign in to the marketplace"
              onClick={onSignIn}
            >
              Sign in
            </button>
          </div>
          <p className="hero-note">
            For clients with ideas. For freelancers with skills.
          </p>
        </div>
        <div className="hero-visual" aria-label="How HustleHub+ works">
          <div className="visual-top">
            <span className="wordmark">
              HustleHub<span>+</span>
            </span>
            <span className="visual-caption">FROM IDEA TO BOOKING</span>
          </div>
          <div className="workflow-step">
            <div>
              <small>01 / DISCOVER</small>
              <strong>Find the right service</strong>
              <p>Browse gigs and compare clear prices.</p>
            </div>
          </div>
          <div className="workflow-connector" />
          <div className="workflow-step">
            <div>
              <small>02 / CONNECT</small>
              <strong>Make it a project</strong>
              <p>Book a gig from your workspace.</p>
            </div>
          </div>
          <div className="workflow-connector" />
          <div className="workflow-step last">
            <div>
              <small>03 / KEEP TRACK</small>
              <strong>Everything in one place</strong>
              <p>Your services, bookings and records.</p>
            </div>
          </div>
        </div>
      </section>
      <section className="start-section" aria-labelledby="start-heading">
        <div className="section-heading">
          <div>
            <h2 id="start-heading">What brings you here?</h2>
          </div>
          <p>Choose how you want to use HustleHub+.</p>
        </div>
        <div className="entry-grid">
          <article className="entry-card">
            <h3>Find a freelancer.</h3>
            <p>
              Browse services, compare pricing and book someone for your next
              project.
            </p>
            <button
              className="text-button"
              onClick={() => onRegister('client')}
            >
              Join as a client
            </button>
          </article>
          <article className="entry-card">
            <h3>Put your skills to work.</h3>
            <p>
              List your services, set your prices and manage bookings from your
              workspace.
            </p>
            <button
              className="text-button"
              onClick={() => onRegister('freelancer')}
            >
              Join as a freelancer
            </button>
          </article>
        </div>
      </section>
    </div>
  );
}
