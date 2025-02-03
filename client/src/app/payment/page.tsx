'use client'
import React from 'react';
import {Elements} from '@stripe/react-stripe-js';
import {loadStripe} from '@stripe/stripe-js';

import CheckoutForm from './checkoutform';






const Index = () => {


    const stripePromise = loadStripe('pk_test_51QmNAjIxGe3lgVLrIecsxmnxNmQwKyEYFW3eU9rCJBgThBrEZhz41EiGrPwA5quMz1ksbj4SnjCvbXBYBzIdUvxm00qFUY5Kuz');


    return (
      
      <Elements stripe={stripePromise}>
        <CheckoutForm />
    </Elements>
  );
};

export default Index;