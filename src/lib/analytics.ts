import ReactGA from 'react-ga4';
import { CONFIG } from '../config';

const GA_MEASUREMENT_ID = CONFIG.GA_MEASUREMENT_ID;

export const initGA = () => {
  if (GA_MEASUREMENT_ID) {
    ReactGA.initialize(GA_MEASUREMENT_ID);
    console.log('GA Initialized');
  }
};

export const logPageView = () => {
  ReactGA.send({ hitType: "pageview", page: window.location.pathname });
};
