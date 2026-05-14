const api = require('./api');

const TIDS = {
  schedule: 'FsdXYQZpHgn-5BnaSq51gVvsikFniEnQE_lBpntTNe0',
  todo: '2x2roFHsREZMOhl5MwzY2b2YklrkX7_09PyV4VN7OZ8',
};

// Request subscription for both templates at once.
// Each accept gives one send quota per template.
function requestAll() {
  const ids = [TIDS.schedule, TIDS.todo];
  wx.requestSubscribeMessage({
    tmplIds: ids,
    success(res) {
      ids.forEach(tid => {
        if (res[tid] === 'accept') {
          api.post('/notify/subscribe', { template_id: tid });
        }
      });
    },
  });
}

// Request a single template
function requestOne(type) {
  const tid = TIDS[type];
  if (!tid) return;
  wx.requestSubscribeMessage({
    tmplIds: [tid],
    success(res) {
      if (res[tid] === 'accept') {
        api.post('/notify/subscribe', { template_id: tid });
      }
    },
  });
}

module.exports = { requestAll, requestOne, TIDS };
