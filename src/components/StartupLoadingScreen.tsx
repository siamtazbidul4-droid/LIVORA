import { useEffect, useRef, useState } from 'react';

const STARTUP_DURATION_MS = 3000;

export const StartupLoadingScreen: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    if (hasInitializedRef.current) {
      return;
    }

    hasInitializedRef.current = true;

    const timeoutId = window.setTimeout(() => {
      setIsVisible(false);
    }, STARTUP_DURATION_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className="startup-screen"
      role="status"
      aria-live="polite"
      aria-label="Loading Novara Commerce"
    >
      <div className="startup-screen__backdrop" aria-hidden="true" />

      <div className="startup-screen__content" aria-hidden="true">
        <div className="startup-screen__brand-wrap">
          <div className="startup-screen__logo-block">
            <span className="startup-screen__logo">LIVORA</span>
            <span className="startup-screen__tagline">Live a Better Home</span>
          </div>

          <div className="startup-screen__genie" aria-hidden="true">
            <div className="startup-screen__genie-cloud startup-screen__genie-cloud--one" />
            <div className="startup-screen__genie-cloud startup-screen__genie-cloud--two" />
            <div className="startup-screen__genie-spark startup-screen__genie-spark--one" />
            <div className="startup-screen__genie-spark startup-screen__genie-spark--two" />
            <div className="startup-screen__genie-spark startup-screen__genie-spark--three" />
            <div className="startup-screen__genie-body">
              <div className="startup-screen__genie-head">
                <span className="startup-screen__genie-face" />
              </div>
              <div className="startup-screen__genie-turban" />
              <div className="startup-screen__genie-arm startup-screen__genie-arm--left" />
              <div className="startup-screen__genie-arm startup-screen__genie-arm--right" />
            </div>
          </div>
        </div>

        <div className="startup-screen__progress" aria-hidden="true">
          <span className="startup-screen__progress-bar" />
        </div>
      </div>
    </div>
  );
};
