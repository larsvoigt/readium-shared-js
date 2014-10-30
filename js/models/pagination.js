ReadiumSDK.Models.Pagination = function () {

    this.storeDefaultPagination = function (openBookData, readerOptions) {

        var view = new ReadiumSDK.Views.ReaderView(readerOptions);

        var spine = undefined;
        openBookData.openPageRequest = undefined

        view.openBook(openBookData, function (s) {
            // hack to get current spine
            // view.spine is undefined ???
            // todo: fixed this issues
            spine = s;
        });

        var i = 0;
        var ready = true;
        var totalPageCount = 0;
        var curPagination = [];

        view.on(ReadiumSDK.Events.PAGINATION_CHANGED, function (pageChangeData) {

            if (pageChangeData.spineItem) {

//                console.log("\nPAGINATION_CHANGED");
                var openPage = pageChangeData.paginationInfo.firstOpenPage();

                if (openPage) {

                    var pageCount = pageChangeData.paginationInfo.getPageCount();
                    var idref = openPage.idref;

                    curPagination.push([
                        {idref: idref},
                        {pageCount: pageCount}
                    ]);

//                    console.debug("openpageId: " + idref);
//                    console.log("page Count: " + pageCount);

                    totalPageCount += pageCount;
                    console.debug("book totalPageCount: " + totalPageCount);
                }

                if (ready) {

                    var nextItem = spine.nextItem(pageChangeData.spineItem);
                    if (nextItem) {
                        ready = false;
                        var openRef = nextItem.idref;
//                        console.debug("openRef: " + openRef);
                        view.openSpineItemPage(openRef, 0, view)
                    }
                }
            }

        });
        view.on(ReadiumSDK.Events.CONTENT_DOCUMENT_LOADED, function ($iframe, spineItem) {
            try {
                if (spineItem && spineItem.idref && $iframe && $iframe[0]) {
//                    console.log("\nCONTENT_DOCUMENT_LOADED");
//                    console.debug(spineItem.href);
                    ready = true;
                }
            }
            catch (err) {
                console.error(err);
            }
        });

        curPagination.push({totalPageCount: totalPageCount});

        localStorage.removeItem('defaultPagination');
        localStorage.setItem('defaultPagination', JSON.stringify(curPagination));
    }
};