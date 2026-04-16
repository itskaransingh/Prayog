/**
 * @file
 * Star rating formatter js.
 */

(function (Drupal, document, Starry) {
  Drupal.behaviors.star_rating = {
    attach: function (context, settings) {
      let starRatingEl = once('star_rating', '.star-rating', context);
      starRatingEl.forEach(function (el) {
        let dataset = el.dataset;
        let readOnly = dataset.hasOwnProperty('readOnly') ? dataset.readOnly : false;
        let stars = dataset.hasOwnProperty('stars') ? (Number(dataset.stars) * 100) / 5  : 0;
        var starRating = new Starry(el, {
          multiRating: true,
          readOnly: readOnly == 'true',
          stars: 5,
          beginWith: stars,
          onRate: function (rating) {
            let hiddenInput = starRating.domElement.parentNode.querySelector('.star-rating-input');
            if (hiddenInput) {
              hiddenInput.value = rating;
            }
          },
        });
      });
    }
  };

})(window.Drupal, window.document, window.Starry);
