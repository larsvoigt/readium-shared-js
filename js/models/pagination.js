

ReadiumSDK.Models.Pagination = function () {

    this.cacheDefaultPagination = function (openBookData, readerOptions) {

        var view = new ReaderView(readerOptions);

        var spine = undefined;
        openBookData.openPageRequest = undefined
        view.openBook(openBookData, function (s) {
            spine = s;
        });

        var i = 0;
        var ready = true;
        var count = 0;
        view.on(ReadiumSDK.Events.PAGINATION_CHANGED, function (pageChangeData) {

            if (pageChangeData.spineItem) {

                console.log("\nPAGINATION_CHANGED");
                var openPage = pageChangeData.paginationInfo.firstOpenPage();

                if (openPage) {
                    console.debug("openpageId: " + openPage.idref);
                    console.log("page count: " + pageChangeData.paginationInfo.getPageCount());
                    count += pageChangeData.paginationInfo.getPageCount();
                    console.debug("book count: " + count);
                }

                if (ready) {

                    var nextItem = spine.nextItem(pageChangeData.spineItem);
                    if (nextItem) {
                        ready = false;
                        var openRef = nextItem.idref;
                        console.debug("openRef: " + openRef);
                        view.openSpineItemPage(openRef, 0, view)
                    }
                }
            }

        });
        view.on(ReadiumSDK.Events.CONTENT_DOCUMENT_LOADED, function ($iframe, spineItem) {
            try {
                if (spineItem && spineItem.idref && $iframe && $iframe[0]) {
                    console.log("\nCONTENT_DOCUMENT_LOADED");
                    console.debug(spineItem.href);
                    ready = true;
                }
            }
            catch (err) {
                console.error(err);
            }
        });
    }
};