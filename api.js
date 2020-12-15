const APIController = (function() {
    
    const clientID = 'ee33e1bbdf964e63bf6b764a32bc776b';
    const clientSecret = '5fc9d48bf9e0496999f8db6726b2244e';

    const _getToken = async () => {

        const result = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type' : 'application/x-www-form-urlencoded', 
                'Authorization' : 'Basic ' + btoa(clientID + ':' + clientSecret)
            },
            body: 'grant_type=client_credentials'
        });

        const data = await result.json();
        return data.access_token;
    }
    
    const _getGenres = async (token) => {

        const result = await fetch(`https://api.spotify.com/v1/browse/categories?locale=sv_US`, {
            method: 'GET',
            headers: { 'Authorization' : 'Bearer ' + token}
        });

        const data = await result.json();
        return data.categories.items;
    }

    const _getPlaylistByGenre = async (token, genreID) => {

        const limit = 10;
        
        const result = await fetch(`https://api.spotify.com/v1/browse/categories/${genreID}/playlists?limit=${limit}`, {
            method: 'GET',
            headers: { 'Authorization' : 'Bearer ' + token}
        });

        const data = await result.json();
        return data.playlists.items;
    }

    const _getTracks = async (token, tracksEndPoint) => {

        const limit = 10;

        const result = await fetch(`${tracksEndPoint}?limit=${limit}`, {
            method: 'GET',
            headers: { 'Authorization' : 'Bearer ' + token}
        });

        const data = await result.json();
        return data.items;
    }

    const _getTrack = async (token, trackEndPoint) => {

        const result = await fetch(`${trackEndPoint}`, {
            method: 'GET',
            headers: { 'Authorization' : 'Bearer ' + token}
        });

        const data = await result.json();
        return data;
    }

    return {
        getToken() {
            return _getToken();
        },
        getGenres(token) {
            return _getGenres(token);
        },
        getPlaylistByGenre(token, genreID) {
            return _getPlaylistByGenre(token, genreID);
        },
        getTracks(token, tracksEndPoint) {
            return _getTracks(token, tracksEndPoint);
        },
        getTrack(token, trackEndPoint) {
            return _getTrack(token, trackEndPoint);
        }
    }
})();


// UI Module
const UIController = (function() {
    const DOMElements = {
        selectGenre: '#select_genre',
        selectPlaylist: '#select_playlist',
        buttonSubmit: '#btn_submit',
        divSongDetail: '#song-detail',
        hfToken: '#hidden_token',
        divSonglist: '.song-list'
    }
    return {

        // Get inputs.
        inputField() {
            return {
                genre: document.querySelector(DOMElements.selectGenre),
                playlist: document.querySelector(DOMElements.selectPlaylist),
                tracks: document.querySelector(DOMElements.divSonglist),
                submit: document.querySelector(DOMElements.buttonSubmit),
                songDetail: document.querySelector(DOMElements.divSongDetail)
            }
        },

        // Methods create select list options.
        createGenre(text, value) {
            const html = `<option value="${value}">${text}</option>`;
            document.querySelector(DOMElements.selectGenre).insertAdjacentHTML('beforeend', html);
        }, 

        createPlaylist(text, value) {
            const html = `<option value="${value}">${text}</option>`;
            document.querySelector(DOMElements.selectPlaylist).insertAdjacentHTML('beforeend', html);
        },

        // Method to creates a track list item.
        createTrack(id, name) {
            const html = `<a href="#" class="list-group-item list-group-item-action list-group-item-light" id="${id}">${name}</a>`;
            document.querySelector(DOMElements.divSonglist).insertAdjacentHTML('beforeend', html);
        },

        // Method to create track metadata.
        createTrackDetail(img, title, artist) {

            const detailDiv = document.querySelector(DOMElements.divSongDetail);
            detailDiv.innerHTML = '';

            const html = 
            `
            <div class="flex-container">
            <div>
                <img src="${img}" class="mx-auto d-block" alt="">        
            </div>
            <div>
                <label for="Genre" class="form-label col-sm-12">${title}</label>
            </div>
            <div>
                <label for="artist" class="form-label col-sm-12">By : ${artist}</label>
            </div> 
            </div>
            `;

            detailDiv.insertAdjacentHTML('beforeend', html)
        },

        resetTrackDetail() {
            this.inputField().songDetail.innerHTML = '';
        },

        resetTracks() {
            this.inputField().tracks.innerHTML = '';
            this.resetTrackDetail();
        },

        resetPlaylist() {
            this.inputField().playlist.innerHTML = '';
            this.resetTracks();
        },
        
        storeToken(value) {
            document.querySelector(DOMElements.hfToken).value = value;
        },

        getStoredToken() {
            return {
                token: document.querySelector(DOMElements.hfToken).value
            }
        }
    }

})();

const APPController = (function(UIControl, APIControl) {

    // Get inputs.
    const DOMInputs = UIControl.inputField();

    // Gets the genres once the page loads.
    const loadGenres = async () => {
        //Gets token
        const token = await APIControl.getToken();           
        //Stores token
        UIControl.storeToken(token);
        //Gets genres
        const genres = await APIControl.getGenres(token);
        genres.forEach(element => UIControl.createGenre(element.name, element.id));
    }

    DOMInputs.genre.addEventListener('change', async () => {
        //Reset
        UIControl.resetPlaylist();
        const token = UIControl.getStoredToken().token;        
        const genreSelect = UIControl.inputField().genre;       
        // Gets the genre ID corresponding with selected genre
        const genreID = genreSelect.options[genreSelect.selectedIndex].value;             
        // Gets the playlist based on a genre
        const playlist = await APIControl.getPlaylistByGenre(token, genreID);       
        // Create a list item for every playlist returned.
        playlist.forEach(p => UIControl.createPlaylist(p.name, p.tracks.href));
    });
     

    DOMInputs.submit.addEventListener('click', async (e) => {
        e.preventDefault();
        // Clears tracks.
        UIControl.resetTracks();
        // Gets token.
        const token = UIControl.getStoredToken().token;        
        const playlistSelect = UIControl.inputField().playlist;
        // Track endpoint based on user playlist.
        const tracksEndPoint = playlistSelect.options[playlistSelect.selectedIndex].value;
        // Gets a list of the tracks.
        const tracks = await APIControl.getTracks(token, tracksEndPoint);
        // Creates a list item for the track.
        tracks.forEach(el => UIControl.createTrack(el.track.href, el.track.name))
        
    });

    DOMInputs.tracks.addEventListener('click', async (e) => {
        e.preventDefault();
        UIControl.resetTrackDetail();
        // Gets token.
        const token = UIControl.getStoredToken().token;
        // Gets track endpoint.
        const trackEndpoint = e.target.id;
        // Gets the track object.
        const track = await APIControl.getTrack(token, trackEndpoint);
        // Track metadata loader.
        UIControl.createTrackDetail(track.album.images[2].url, track.name, track.artists[0].name);
    });    

    return {
        init() {
            console.log('App is starting');
            loadGenres();
        }
    }

})(UIController, APIController);
APPController.init();




