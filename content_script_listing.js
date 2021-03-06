const applyLoadMoreObserver = () => {
  // Mutation Observer for 'load more' offers
  const loadMoreNode = document.querySelectorAll("#tour-offers-list")[0];

  const loadMoreObserver = new MutationObserver(function (mutations) {
    const addedOffersLength = mutations.length;
    const currentOffersLength = document.querySelectorAll("#tour-offers-list")[0].childNodes.length - 1 - addedOffersLength;
    const newOffersLength = document.querySelectorAll("#tour-offers-list")[0].childNodes.length - 1;

    for (
      tradeNum = currentOffersLength;
      tradeNum < newOffersLength;
      tradeNum++
    ) {
      getProfile(tradeNum);
    }
  });

  loadMoreObserver.observe(loadMoreNode, {
    childList: true,
  });
};

const applyLoadDifferentObserver = () => {
  // Mutation Observer for 'load different type' of offers
  // Select the node that will be observed for changes to its DOM
  const loadDifferentNode = document.querySelectorAll("#tour-offers-list")[1];

  // Set up the callback function to execute when a mutatio occurs
  // Everytime there is a mutation, it will add an object regarding everything about the mutation to our 'mutations' array which we will then loop over to access each 'mutation'
  const loadDifferentObserver = new MutationObserver(function (mutations) {
    const addedOffersLength = mutations.length;
    const currentOffersLength = document.getElementsByClassName('Offer__content').length - addedOffersLength;
    const newOffersLength = document.getElementsByClassName('Offer__content').length;

    for (
      tradeNum = currentOffersLength;
      tradeNum < newOffersLength;
      tradeNum++
    ) {
      getProfile(tradeNum);
    }
    
  });

  // Start observing the selected node for mutations
  // The 2nd argument allows you to configure which mutations you want to look for ( here we are looking for changes to the child nodes )
  loadDifferentObserver.observe(loadDifferentNode, {
    childList: true,
  });
};

const applyLoadNewObserver = () => {
  const loadNewNode = document.querySelector('div[class="offersContainer"]');

  const loadNewObserver = new MutationObserver(function (mutations){
    console.log(mutations);
    console.log(mutations[4].addedNodes[0]);

    if (mutations[4].addedNodes[0] == document.querySelector('div[class="d-lg-flex mt-md-4 flex-column"]')){
      addObserverWhenTableGenerated();
    }
  });

  loadNewObserver.observe(loadNewNode, {
    childList: true,
  });

};

const addObserverWhenTableGenerated = () => {
  const offerTableNode = document.querySelector('#tour-offers-list');

  if (!offerTableNode) {
    window.setTimeout(addObserverWhenTableGenerated,500);
    return;
  }

  getProfiles();
};


const getProfiles = () => {
  // Gets an array of all the offers
  const offerList = document.getElementsByClassName('Offer__content');

  // Calls all the getProfile index in a single loop without waiting for each function to finish
  for (tradeNum = 0; tradeNum < offerList.length; tradeNum++) {
    // pass the index value of the array (tradeNum) to the getProfile() as an argument
    getProfile(tradeNum);
  }

  applyLoadDifferentObserver();

  applyLoadMoreObserver();
};

const getFeedback = async (tradeNum) => {
  try {
    // feedback
    const paymentType = document.querySelectorAll(
      'p[class="align-bottom d-inline m-0 mr-2 regular-24 text-break OfferPaymentMethod__paymentMethodName"]'
    )[tradeNum].innerText;
    const username = document.querySelectorAll(
      'a[class="OfferUser__userInfo"]'
    )[tradeNum].innerText;

    // Getting the first page of buy and sell just to see how many pages we need to call
    const fetchBuyerFeedbackPage1 = fetch(
      `https://paxful.com/rest/v1/users/${username}/feedbacks?camelCase=1&feedback=all&offer_type=sell&f_page=1`
    );
    const fetchSellerFeedbackPage1 = fetch(
      `https://paxful.com/rest/v1/users/${username}/feedbacks?camelCase=1&feedback=all&offer_type=buy&f_page=1`
    );

    const page1FeedbackResponse = await Promise.all([
      fetchBuyerFeedbackPage1,
      fetchSellerFeedbackPage1,
    ]);

    const buyerFeedbackData = await page1FeedbackResponse[0].json();
    const sellerFeedbackData = await page1FeedbackResponse[1].json();

    let numberOfBuyerFeedbackPages = Math.ceil(buyerFeedbackData.total / 15);
    let numberOfSellerFeedbackPages = Math.ceil(sellerFeedbackData.total / 15);

    if (numberOfBuyerFeedbackPages > 17) {
      numberOfBuyerFeedbackPages = 17;
    }
    if (numberOfSellerFeedbackPages > 17) {
      numberOfSellerFeedbackPages = 17;
    }

    // Initializing the feedback values for buy and sell
    let totalFeedbackOfBitcoinSoldWithPaymentX = 0;
    let totalFeedbackOfBitcoinBoughtWithPaymentX = 0;

    // Querying all the buyer feedback pages and adding the promise to an array
    const buyerFeedbackPagesPromises = [];
    for (let page = 1; page <= numberOfBuyerFeedbackPages; page++) {
      buyerFeedbackPagesPromises.push(
        fetch(
          `https://paxful.com/rest/v1/users/${username}/feedbacks?camelCase=1&feedback=all&offer_type=sell&f_page=${page}`
        )
      );
    }
    // Querying all the seller feedback pages and adding the promise to an array
    const sellerFeedbackPagesPromises = [];
    for (let page = 1; page <= numberOfSellerFeedbackPages; page++) {
      sellerFeedbackPagesPromises.push(
        fetch(
          `https://paxful.com/rest/v1/users/${username}/feedbacks?camelCase=1&feedback=all&offer_type=buy&f_page=${page}`
        )
      );
    }

    // Awaiting the promises to resolve
    const buyerFeedbackResponses = await Promise.all(
      buyerFeedbackPagesPromises
    );
    const sellerFeedbackResponses = await Promise.all(
      sellerFeedbackPagesPromises
    );

    // Turning the buyer feedback resolved promises into JSON promises
    let buyerFeedbackJsonPromises = [];
    for (response in buyerFeedbackResponses) {
      buyerFeedbackJsonPromises.push(buyerFeedbackResponses[response].json());
    }
    // Turning the seller feedback resolved promises into JSON promises
    let sellerFeedbackJsonPromises = [];
    for (response in sellerFeedbackResponses) {
      sellerFeedbackJsonPromises.push(sellerFeedbackResponses[response].json());
    }

    // awaiting the JSON promises to resolve
    let buyerFeedbackJsons = await Promise.all(buyerFeedbackJsonPromises);
    let sellerFeedbackJsons = await Promise.all(sellerFeedbackJsonPromises);

    // Looping through the buyer and seller feedback data individually, adding a count everytime a data is matched
    for (json in buyerFeedbackJsons) {
      for (i in buyerFeedbackJsons[json].data) {
        if (buyerFeedbackJsons[json].data[i].paymentMethodName == paymentType) {
          totalFeedbackOfBitcoinSoldWithPaymentX += 1;
        }
      }
    }
    for (json in sellerFeedbackJsons) {
      for (i in sellerFeedbackJsons[json].data) {
        if (
          sellerFeedbackJsons[json].data[i].paymentMethodName == paymentType
        ) {
          totalFeedbackOfBitcoinBoughtWithPaymentX += 1;
        }
      }
    }
    // Total number of feedbacks
    const totalNumberOfFeedbackWithPaymentX =
      totalFeedbackOfBitcoinSoldWithPaymentX +
      totalFeedbackOfBitcoinBoughtWithPaymentX;

    // Feedback Information Div to hold all the info
    let feedbackInformationDiv = document.createElement('div');

    // Creating the DOM elements and adding it to the page
    let feedbackPara = document.createElement('p');
    feedbackPara.style = 'margin-bottom: 0px; margin-top: 5px;';

    // creating muted title
    let feedbackTitleSpan = document.createElement('span');
    let feedbackTitleText = document.createTextNode(
      `Total ${paymentType} feedback: `
    );
    feedbackTitleSpan.className = 'text-muted';
    feedbackTitleSpan.appendChild(feedbackTitleText);

    // creating feedback number value
    let feedbackValueSpan = document.createElement('span');
    let feedbackValueText = document.createTextNode(
      totalNumberOfFeedbackWithPaymentX
    );
    feedbackValueSpan.appendChild(feedbackValueText);

    feedbackPara.appendChild(feedbackTitleSpan);
    feedbackPara.appendChild(feedbackValueSpan);

    feedbackInformationDiv.appendChild(feedbackPara);

    // Buyer and seller breakdown of the feedback
    let feedbackBreakdownUl = document.createElement('ul');

    // buyer
    let buyerFeedbackLi = document.createElement('li');
    let buyerFeedbackLiTitleSpan = document.createElement('span');
    buyerFeedbackLiTitleSpan.className = 'text-muted';
    let buyerFeedbackLiTitleText = document.createTextNode(
      `Total feedback from buyers using ${paymentType}: `
    );
    buyerFeedbackLiTitleSpan.appendChild(buyerFeedbackLiTitleText);

    let buyerFeedbackLiValueSpan = document.createElement('span');
    let buyerFeedbackLiValueText = document.createTextNode(
      totalFeedbackOfBitcoinBoughtWithPaymentX
    );
    buyerFeedbackLiValueSpan.appendChild(buyerFeedbackLiValueText);

    buyerFeedbackLi.appendChild(buyerFeedbackLiTitleSpan);
    buyerFeedbackLi.appendChild(buyerFeedbackLiValueSpan);

    feedbackBreakdownUl.appendChild(buyerFeedbackLi);

    // seller
    let sellerFeedbackLi = document.createElement('li');
    let sellerFeedbackLiTitleSpan = document.createElement('span');
    sellerFeedbackLiTitleSpan.className = 'text-muted';
    let sellerFeedbackLiTitleText = document.createTextNode(
      `Total feedback from sellers using ${paymentType}: `
    );
    sellerFeedbackLiTitleSpan.appendChild(sellerFeedbackLiTitleText);

    let sellerFeedbackLiValueSpan = document.createElement('span');
    let sellerFeedbackLiValueText = document.createTextNode(
      totalFeedbackOfBitcoinSoldWithPaymentX
    );
    sellerFeedbackLiValueSpan.appendChild(sellerFeedbackLiValueText);

    sellerFeedbackLi.appendChild(sellerFeedbackLiTitleSpan);
    sellerFeedbackLi.appendChild(sellerFeedbackLiValueSpan);

    feedbackBreakdownUl.appendChild(sellerFeedbackLi);

    feedbackInformationDiv.appendChild(feedbackBreakdownUl);

    document
      .getElementsByClassName('Offer__content')
      [tradeNum].querySelector(
        'div[class="col order-5 order-lg-2 mt-2 mt-lg-0 qa-paymentMethodGroup"]'
      )
      .appendChild(feedbackInformationDiv);
  } catch (error) {
    console.error(error);
  }
};

// Callback function
const getProfile = async (tradeNum) => {
  try {
    // Retrieves the profile's URL link
    const profilePath = document
      .getElementsByClassName('Offer__content')
      [tradeNum].querySelector('.OfferUser__userInfo')
      .getAttribute('href');

    const res = await fetch(profilePath);

    if (!res.ok) {
      throw 'network error';
    }
    // Returns the HTML content of a page as text
    const html = await res.text();

    // Create a dummy HTML page that will convert the HTML string into an actual HTML page
    let dummyHTML = document.createElement('html');
    dummyHTML.innerHTML = `${html}`;

    let lengthInfo = dummyHTML
      .getElementsByClassName('list-group')[1]
      .getElementsByClassName('list-group-item').length;
    let tradePartners = dummyHTML
      .getElementsByClassName('list-group')[1]
      .getElementsByClassName('list-group-item')
      [lengthInfo - 8].getElementsByTagName('strong')[0].innerText;
    let tradeNumber = dummyHTML
      .getElementsByClassName('list-group')[1]
      .getElementsByClassName('list-group-item')
      [lengthInfo - 7].getElementsByTagName('strong')[0].innerText;
    let tradeVolume = dummyHTML
      .getElementsByClassName('list-group')[1]
      .getElementsByClassName('list-group-item')
      [lengthInfo - 6].getElementsByTagName('strong')[0].innerText;
    let verifiedDataContent = dummyHTML
      .getElementsByClassName('list-group-item d-flex align-items-center')[2]
      .querySelector('span')
      .getAttribute('data-content');
    let verifiedArray = verifiedDataContent.split(' ');
    let verifiedDate = verifiedArray.slice(9, 12).join(' ');

    let verifiedDatePara = document.createElement('p');
    let verifiedDateText = document.createTextNode(
      `ID verified: ${verifiedDate} ago`
    );
    verifiedDatePara.appendChild(verifiedDateText);
    let profileNameDiv = document
      .getElementsByClassName('Offer__content')
      [tradeNum].getElementsByClassName(
        'order-1 col-5 col-lg-2 d-flex flex-column pr-0'
      )[0]
      .querySelector('div [class="d-flex align-items-center"]');
    verifiedDatePara.style =
      'color: #818181; font-size: 12px; line-height: 14px; font-family: Open Sans; font-style: normal; font-weight: normal; padding-top: 5px; margin-bottom: 10px;';
    profileNameDiv.insertAdjacentElement('afterend', verifiedDatePara);

    let tradeInformationDiv = document.createElement('div');
    tradeInformationDiv.style = 'margin-top: 10px;';

    // trade partners
    let tradePartnersPara = document.createElement('p');
    tradePartnersPara.style = 'margin-bottom: 0px';

    let tradePartnersTitleSpan = document.createElement('span');
    let tradePartnersTitleText = document.createTextNode('Trade partners: ');
    tradePartnersTitleSpan.className = 'text-muted';
    tradePartnersTitleSpan.appendChild(tradePartnersTitleText);

    let tradePartnersValueSpan = document.createElement('span');
    let tradePartnersValueText = document.createTextNode(tradePartners);
    tradePartnersValueSpan.appendChild(tradePartnersValueText);

    tradePartnersPara.appendChild(tradePartnersTitleSpan);
    tradePartnersPara.appendChild(tradePartnersValueSpan);

    tradeInformationDiv.appendChild(tradePartnersPara);

    // trade volume
    let tradeVolumePara = document.createElement('p');
    tradeVolumePara.style = 'margin-bottom: 0px';

    let tradeVolumeTitleSpan = document.createElement('span');
    let tradeVolumeTitleText = document.createTextNode('Trade volume: ');
    tradeVolumeTitleSpan.className = 'text-muted';
    tradeVolumeTitleSpan.appendChild(tradeVolumeTitleText);

    let tradeVolumeValueSpan = document.createElement('span');
    let tradeVolumeValueText = document.createTextNode(tradeVolume);
    tradeVolumeValueSpan.appendChild(tradeVolumeValueText);

    tradeVolumePara.appendChild(tradeVolumeTitleSpan);
    tradeVolumePara.appendChild(tradeVolumeValueSpan);

    tradeInformationDiv.appendChild(tradeVolumePara);

    // trade number
    let tradeNumberPara = document.createElement('p');
    tradeNumberPara.style = 'margin-bottom: 0px';

    let tradeNumberTitleSpan = document.createElement('span');
    let tradeNumberTitleText = document.createTextNode('Total trades: ');
    tradeNumberTitleSpan.className = 'text-muted';
    tradeNumberTitleSpan.appendChild(tradeNumberTitleText);

    let tradeNumberValueSpan = document.createElement('span');
    let tradeNumberValueText = document.createTextNode(tradeNumber);
    tradeNumberValueSpan.appendChild(tradeNumberValueText);

    tradeNumberPara.appendChild(tradeNumberTitleSpan);
    tradeNumberPara.appendChild(tradeNumberValueSpan);

    tradeInformationDiv.appendChild(tradeNumberPara);

    // Appending the whole trade information div
    document
      .getElementsByClassName('Offer__content')
      [tradeNum].getElementsByClassName(
        'col-3 d-none d-lg-block order-lg-3 mt-4 regular-20 text-right'
      )[0]
      .appendChild(tradeInformationDiv);

    // Past 500 feedback
    let feedbackButton = document.createElement('button');
    feedbackButton.className = 'btn btn-primary';
    feedbackButton.style = `margin-top: 10px;`;
    let feedbackButtonText = document.createTextNode('Get Past 500 Feedback');
    feedbackButton.appendChild(feedbackButtonText);
    feedbackButton.onclick = () => {
      getFeedback(tradeNum);
      feedbackButton.disabled = true;
    };

    document
      .getElementsByClassName('Offer__content')
      [tradeNum].querySelector(
        'div[class="col order-5 order-lg-2 mt-2 mt-lg-0 qa-paymentMethodGroup"]'
      )
      .appendChild(feedbackButton);
  } catch (error) {
    console.error(error);
  }
};

// This will only call the callback function once the page has fully loaded
window.addEventListener('load', applyLoadNewObserver);
