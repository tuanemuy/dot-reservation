window.addEventListener("load", () => {
  // CLOSE SIDEBAR ON MOBILE
  // =======================================================
  (() => {
    const resolution = "1024";
    const sidebar = HSOverlay.getInstance("#hs-pro-chtshid1", true);
    const _tabs = HSTabs.getInstance(
      '#hs-pro-tabs-chtshid-all > [role="tablist"]',
      true,
    );

    window.addEventListener("change.hs.tab", (evt) => {
      if (!evt.target.closest("#hs-pro-tabs-chtshid-all")) return false;

      if (window.innerWidth < Number.parseInt(resolution, 10))
        sidebar.element.close();
    });
  })();
});
