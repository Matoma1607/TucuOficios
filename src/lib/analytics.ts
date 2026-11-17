import ReactGA from 'react-ga4';

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

export const hasAnalytics = Boolean(GA_MEASUREMENT_ID);

export const initGA = () => {
  if (GA_MEASUREMENT_ID) {
    ReactGA.initialize(GA_MEASUREMENT_ID);
  }
};

export const logPageView = () => {
  if (!GA_MEASUREMENT_ID) return;
  ReactGA.send({ hitType: 'pageview', page: window.location.pathname });
};
