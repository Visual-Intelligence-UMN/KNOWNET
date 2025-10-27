import React from 'react';

// Create a context with a default empty implementation
const FlowContext = React.createContext({
  onRecommendationClick: (recommendation) => {}
});

export default FlowContext;
