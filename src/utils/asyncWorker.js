const asyncWorker = (opts = { initialState, maxTimeout, onTriggered, toProceed }) => {
  const { initialState, maxTimeout, onTriggered, toProceed } = opts;

  let prevState = initialState;

  const runAsyncLoop = () =>
    setTimeout(() => {
      (async () => {
        try {
          const stateCurr = await onTriggered(prevState);
          const toProceedFlag = await toProceed(stateCurr);

          prevState = stateCurr;

          if (toProceedFlag) {
            runAsyncLoop();
          }
        } catch (e) {
          console.error(e);
        }
      })();
    }, maxTimeout);

  return runAsyncLoop;
};

export default asyncWorker;
