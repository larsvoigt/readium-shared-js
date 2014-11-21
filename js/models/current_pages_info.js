//  Created by Boris Schneiderman.
//  Copyright (c) 2014 Readium Foundation and/or its licensees. All rights reserved.
//  
//  Redistribution and use in source and binary forms, with or without modification, 
//  are permitted provided that the following conditions are met:
//  1. Redistributions of source code must retain the above copyright notice, this 
//  list of conditions and the following disclaimer.
//  2. Redistributions in binary form must reproduce the above copyright notice, 
//  this list of conditions and the following disclaimer in the documentation and/or 
//  other materials provided with the distribution.
//  3. Neither the name of the organization nor the names of its contributors may be 
//  used to endorse or promote products derived from this software without specific 
//  prior written permission.
//  
//  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND 
//  ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED 
//  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. 
//  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, 
//  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, 
//  BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, 
//  DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF 
//  LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE 
//  OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED 
//  OF THE POSSIBILITY OF SUCH DAMAGE.

/**
 * Used to report pagination state back to the host application
 *
 * @class ReadiumSDK.Models.CurrentPagesInfo
 *
 * @constructor
 *
 * @param {ReadiumSDK.Models.Spine} spine
 * @param {boolean} isFixedLayout is fixed or reflowable spine item
*/

ReadiumSDK.Models.CurrentPagesInfo = function(spine, isFixedLayout) {

    var self = this;
    var _defaultPagination = JSON.parse(localStorage.getItem('defaultPagination'));

    this.isRightToLeft = spine.isRightToLeft();
    this.isFixedLayout = isFixedLayout;
    this.openPages = [];

    this.addOpenPage = function (spineItemPageIndex, spineItemPageCount, idref, spineItemIndex, viewPortArea) {

        this.openPages.push({
            spineItemPageIndex: spineItemPageIndex,
            spineItemPageCount: spineItemPageCount,
            idref: idref,
            spineItemIndex: spineItemIndex,
            viewPortArea: viewPortArea
        });
        sort();
    };

    this.canGoLeft = function () {
        return this.isRightToLeft ? this.canGoNext() : this.canGoPrev();
    };

    this.canGoRight = function () {
        return this.isRightToLeft ? this.canGoPrev() : this.canGoNext();
    };

    this.canGoNext = function() {

        if(this.openPages.length == 0)
            return false;

        var lastOpenPage = this.openPages[this.openPages.length - 1];

        // TODO: handling of non-linear spine items ("ancillary" documents), allowing page turn within the reflowable XHTML, but preventing previous/next access to sibling spine items. Also needs "go back" feature to navigate to source hyperlink location that led to the non-linear document.
        // See https://github.com/readium/readium-shared-js/issues/26
        
        // Removed, needs to be implemented properly as per above.
        // See https://github.com/readium/readium-shared-js/issues/108
        // if(!spine.isValidLinearItem(lastOpenPage.spineItemIndex))
        //     return false;

        return lastOpenPage.spineItemIndex < spine.last().index || lastOpenPage.spineItemPageIndex < lastOpenPage.spineItemPageCount - 1;
    };

    this.canGoPrev = function() {

        if(this.openPages.length == 0)
            return false;

        // TODO: handling of non-linear spine items ("ancillary" documents), allowing page turn within the reflowable XHTML, but preventing previous/next access to sibling spine items. Also needs "go back" feature to navigate to source hyperlink location that led to the non-linear document.
        // See https://github.com/readium/readium-shared-js/issues/26
        
        // Removed, needs to be implemented properly as per above.
        // //https://github.com/readium/readium-shared-js/issues/108
        // if(!spine.isValidLinearItem(firstOpenPage.spineItemIndex))
        //     return false;

        return spine.first().index < this.firstOpenPage().spineItemIndex || 0 < this.firstOpenPage().spineItemPageIndex;
    };
    
    this.firstOpenPage = function () {

        if (this.openPages.length == 0) {
            return undefined;
        }
        return this.openPages[0];
    }

    this.getPageNumbers = function () {

        var res = [];
        for (var pageInfo in this.openPages) {
            var pageIndex = this.isFixedLayout ? (this.openPages[pageInfo].spineItemIndex + 1)
                : getCurrPageNumber(pageInfo);

            res.push(pageIndex);
        }
        return res.join("-");
    }

    this.getPageCount = function () {

        if (!isOpen()) {
            return 0;
        }
        return this.isFixedLayout ? spine.items.length : self.firstOpenPage().spineItemPageCount;
    }

    this.getTotalPageCount = function () {

        if (this.isFixedLayout) {

            return spine.items.length;

        } else {

            var firstOpenPage = self.firstOpenPage();

            if (_defaultPagination != undefined) {

                return Math.round(_defaultPagination.totalPageCount / getRatio(firstOpenPage.viewPortArea));
            }
        }
    }


    function getCurrPageNumber(pageInfo) {

        var pageIndex = self.openPages[pageInfo].spineItemPageIndex + 1;

        if (_defaultPagination != undefined) {

            var currPageCount = 0;
            var defaultPageCounts = _defaultPagination.defaultSpineItemTotalPageCounts;

            for (var i = 0; i < defaultPageCounts.length; i++) {

                if (defaultPageCounts[i].idref && defaultPageCounts[i].idref == self.openPages[pageInfo].idref)
                    break;

                if (defaultPageCounts[i].defaultSpineItemPageCount)
                    currPageCount += defaultPageCounts[i].defaultSpineItemPageCount;
            }

            var ratio = getRatio(self.openPages[pageInfo].viewPortArea);
            //console.debug("ratio: " +  ratio);
            //console.debug("currPageCount: " + currPageCount);
            //console.debug("pageIndex: " + pageIndex);
            //console.debug("raw pageindex: " + ((currPageCount / ratio) + pageIndex));

            if (ratio > 1)
                pageIndex += Math.ceil(currPageCount / ratio);
            else
                pageIndex += Math.floor(currPageCount / ratio);
            //pageIndex += Math.round(currPageCount / ratio);
            //console.debug("pageindex: " + pageIndex + "\n");

        }
        //if (ratio != 1)
        //    pageIndex = balancer(pageIndex);
        //localStorage.setItem('lastPageIndex', pageIndex);
        return pageIndex;
    }

    function isOpen() {
        return self.openPages.length > 0;
    }

    function getRatio(CurrViewPortArea) {

        return CurrViewPortArea / getDefaultViewPortArea();
    }

    function getDefaultViewPortArea() {

        var defaultViewPortSize = _defaultPagination.defaultViewPortSize;
        return defaultViewPortSize.height * defaultViewPortSize.width;
    }

    //function balancer(pageindex) {
    //
    //    var lastPageIndex = localStorage.getItem('lastPageIndex');
    //    if(lastPageIndex){
    //
    //        var diff = pageindex - lastPageIndex;
    //        if(diff == 1 || diff == -1)
    //            return pageindex;
    //        else if(diff > 1)
    //            return pageindex - diff + 1;
    //        else if(diff < -1)
    //            return pageindex + diff - 1;
    //        else if(diff == 0)
    //            return pageindex + 1;
    //    }
    //
    //    return pageindex;
    //}

    function sort() {

        self.openPages.sort(function (a, b) {

            if(a.spineItemIndex != b.spineItemIndex) {
                return a.spineItemIndex - b.spineItemIndex;
            }

            return a.pageIndex - b.pageIndex;

        });

    };

};
