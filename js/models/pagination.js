ReadiumSDK.Models.Pagination = function (readerView) {

    var _readerView = readerView;
    var _view = undefined;
    var _spine = undefined;
    var _contentLoaded = true;
    var _totalPageCount = 0;
    var _pagination = {
        defaultSpineItemTotalPageCounts : [],
        defaultViewPortSize : undefined,
        totalPageCount : 0
    };

    this.storeDefaultPagination = function (openBookData, readerOptions) {

        // Todo: proof book was open, than don't delete default pagination
        localStorage.removeItem('defaultPagination');

        _view = new ReadiumSDK.Views.ReaderView(readerOptions);

        openBookData.openPageRequest = undefined

        _view.openBook(openBookData, function (s) {
            // hack to get the spine
            // _view.spine has no spine collection inside, I don't understand why???
            // todo: fixed this issues
            _spine = s;
        });

        _view.on(ReadiumSDK.Events.PAGINATION_CHANGED, paginationChangedHandler);
        _view.on(ReadiumSDK.Events.CONTENT_DOCUMENT_LOADED, contentLoadedHandler);
    }

    function paginationChangedHandler(pageChangeData) {

        if (pageChangeData.spineItem) {

//                console.log("\nPAGINATION_CHANGED");
            var openPage = pageChangeData.paginationInfo.firstOpenPage();

            if (openPage) {

                var defaultSpineItemPageCount = pageChangeData.paginationInfo.getPageCount();
                var idref = openPage.idref;

                _pagination.defaultSpineItemTotalPageCounts.push({
                    idref: idref,
                    defaultSpineItemPageCount: defaultSpineItemPageCount
                });

                _totalPageCount += defaultSpineItemPageCount;
            }

            if (_contentLoaded) {

                var nextItem = _spine.nextItem(pageChangeData.spineItem);

                if (nextItem) {

                    _contentLoaded = false;
                    var openRef = nextItem.idref;
                    _view.openSpineItemPage(openRef, 0, _view)

                } else {

                    _pagination.defaultViewPortSize = _view.getViewPortSize();
                    _pagination.totalPageCount = _totalPageCount;

                    localStorage.setItem('defaultPagination', JSON.stringify(_pagination));

                    removeEventHandler();

                    // all readerview instances will render to the same viewport
                    // so it is below necessary to clean up the viewport from
                    // temporary iframe
                    // todo: other options?
                    $('#epub-reader-frame').children().slice(1).detach();

                    _readerView.triggerPaginationChangedEvent();
                }
            }
        }
    };

    function contentLoadedHandler($iframe, spineItem) {
        
        try {
            if (spineItem && spineItem.idref && $iframe && $iframe[0]) {
                _contentLoaded = true;
            }
        }
        catch (err) {
            console.error(err);
        }
    };

    function removeEventHandler() {
        _view.off(ReadiumSDK.Events.PAGINATION_CHANGED);
        _view.off(ReadiumSDK.Events.CONTENT_DOCUMENT_LOADED);
    }
};