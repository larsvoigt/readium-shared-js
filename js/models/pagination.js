ReadiumSDK.Models.Pagination = function () {

    var _view = undefined;
    var _spine = undefined;
    var _contentLoaded = true;
    var _totalPageCount = 0;
    var _curPagination = [];

    this.storeDefaultPagination = function (openBookData, readerOptions) {

        // Todo: proof book was open don delete defaultPagination
        localStorage.clear();
        localStorage.removeItem('defaultPagination');

        _view = new ReadiumSDK.Views.ReaderView(readerOptions);

        openBookData.openPageRequest = undefined

        _view.openBook(openBookData, function (s) {
            // hack to get current spine
            // view.spine is undefined ???
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

                var pageCount = pageChangeData.paginationInfo.getPageCount();
                var idref = openPage.idref;

                _curPagination.push({
                    idref: idref,
                    pageCount: pageCount
                });

//                    console.debug("openpageId: " + idref);
//                    console.log("page Count: " + pageCount);

                _totalPageCount += pageCount;
//                    console.debug("book totalPageCount: " + totalPageCount);
            }

            if (_contentLoaded) {

                var nextItem = _spine.nextItem(pageChangeData.spineItem);
                if (nextItem) {
                    _contentLoaded = false;
                    var openRef = nextItem.idref;
//                        console.debug("openRef: " + openRef);
                    _view.openSpineItemPage(openRef, 0, _view)
                } else {
                    _curPagination.push({totalPageCount: _totalPageCount});
                    localStorage.setItem('defaultPagination', JSON.stringify(_curPagination));
                    removeEventHandler();
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