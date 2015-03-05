    var graph = Viva.Graph.graph();

    //to store all the words 
    var allMatchedWords = {};


    //connect to the Mongo database
    var socket = io.connect('http://sociamvm-app-001.ecs.soton.ac.uk:3002');
    //call this when the page loads 
    socket.emit("load_data","");



    //for interval updating
   function loadLatestData(){
    socket.emit("load_data","");
  };


  socket.on('historic_data', function (data) {
       console.log("Historic Data found");
      var count = data.length;
      var responses="";
         $("#responses span").html(count);

         //it would be good to populate an old list of SOCIAL MACHINE defintions
         createOverviewOfTerms(data);
    });

    $('#download_data').on('click', function(event) {
      event.preventDefault();

     //need to download all the data...

    });

  

  socket.on('realtime_data', function (data) {
      console.log("Realtime Data found");
      console.log(data);

      //if it's the website data, handle differently....
      if(data.message != undefined){
        updateNewList(data);
      }

     	for(var i=data.length-1; i>(data.length-11); i--){

     	  //update the real-time list...
          updateNewList(data[i]);

         }

    });



    socket.on('edge_data', function (matchedWords) {

      console.log("Graph data found");
      console.log(matchedWords);
          //now we need to construct a graph
      //the number of words 
      for(word in matchedWords){
     
      //make the nodes
      var cnt = 0;
      while(cnt <= matchedWords[word]){
         if(cnt==0){
          graph.addNode(word.toString()+"_"+cnt.toString(), word.toString());
        }else{
          graph.addNode(word.toString()+"_"+cnt.toString(), "");

        }
        ++cnt;
      }
      //construct the edges
      var cnt = 0;
      while(cnt < matchedWords[word]){
        graph.addLink(word.toString()+"_"+cnt.toString(),word.toString()+"_"+(cnt+1).toString());
        ++cnt;
      }
    }

    allMatchedWords = matchedWords;

    console.log("Nodes Added: "+graph.getNodesCount());
    console.log("Links Added: "+graph.getLinksCount());

    });


 socket.on('realtime_edge_data', function (matchedWords) {

      console.log("Realtime Graph data found");
      console.log(matchedWords);
          //now we need to construct a graph
      //the number of words 
      for(word in matchedWords){
     
      //make the nodes
      var cnt = 0;
      while(cnt <= matchedWords[word]){
        var addToCnt =0;
        if(word in allMatchedWords){
          addToCnt = allMatchedWords[word];
          console.log("TERM ALREADY KNOWN");

        }else{
          //need to add the new term
          allMatchedWords[word] = matchedWords[word];
        }



        if((cnt+addToCnt)==0){
          graph.addNode(word.toString()+"_"+(cnt+addToCnt).toString(), word.toString());
        }else{
          graph.addNode(word.toString()+"_"+(cnt+addToCnt).toString(), "");

        }
        ++cnt;
      }
      //construct the edges
      var cnt = 0;
      while(cnt < matchedWords[word]){
        //add to end of cascase
        graph.addLink(word.toString()+"_"+addToCnt.toString(),word.toString()+"_"+(cnt+addToCnt+1).toString());
        ++cnt;
      }
    }


    console.log("Nodes Added: "+graph.getNodesCount());
    console.log("Links Added: "+graph.getLinksCount());

    //update view
      $("#activeflows span").html(graph.getLinksCount());


    });



   
function createOverviewOfTerms(data) {

  //oldest item/

  var oldestMsg = data[data.length-1]



}


//Here we updat the list with either Twitter Or 

var numOfItems = 0;
function updateNewList(data){
 
      if(numOfItems>3){
        $('#loc li:last').remove();
        --numOfItems;
      }

        //console.log(node.id, node.data.tags);

      try{
          if(data.message != undefined){

            var msg = highlightMatchedWords(data.message);

              $('<li>Source: ' +  'Website' + ' Date: ' +
                data.date + '<p>' + 
                msg + '<p></li>').prependTo('ul#loc');
                    ++numOfItems;

        }
      }catch(e){

       // console.log(e);
      }
      try{  
          if(data.message === undefined){

          var msg = highlightMatchedWords(data.text);      
           $('<li><strong>Source:</strong> ' +  'Twitter' + ' <strong>Date:</strong> ' +
                data.created_at + '<p>' + 
                msg + '<p></li>').prependTo('ul#loc');
              ++numOfItems;
            }
      }catch(e){
        //console.log(e)
      } 

}


function highlightMatchedWords(message){

  var newmsg = ""
  var words = message.split(" ");
  for(word in words){

    if(words[word] in allMatchedWords){
      words[word] = '<mark>'+words[word]+'</mark>'
    }
    newmsg = newmsg+" "+words[word]+" ";

  }
  return newmsg;
}


function main(){
            
            // Step 2. We add nodes and edges to the graph:
           // graph.addLink(1, 2);
            /* Note: graph.addLink() creates new nodes if they are not yet
               present in the graph. Thus calling this method is equivalent to:
               graph.addNode(1);
               graph.addNode(2);
               graph.addLink(1, 2);
            */
            // Step 3. Render the graph.
            

            var layout = Viva.Graph.Layout.forceDirected(graph, {
                springLength : 10,
                springCoeff : 0.0010,
                dragCoeff : 0.02,
                gravity : -0.01
            });

            // Set custom nodes appearance
            var graphics = Viva.Graph.View.svgGraphics();
            nodeSize = 32;
            try{
            graphics.node(function(node) {
                   // The function is called every time renderer needs a ui to display node
                var ui =  Viva.Graph.svg("g")
                         // .attr("width", 10)
                         // .attr("height", 5) 
                         .attr("fill", "white"),
                      
                    svgText = Viva.Graph.svg('text')
                              .attr('y', '-4px')
                              .text(node.data);
                
                ui.append(svgText);                
                return ui;    
                }).placeNode(function(nodeUI, pos) {
                // 'g' element doesn't have convenient (x,y) attributes, instead
                // we have to deal with transforms: http://www.w3.org/TR/SVG/coords.html#SVGGlobalTransformAttribute
                nodeUI.attr('transform',
                            'translate(' +
                                  (pos.x - nodeSize/2) + ',' + (pos.y - nodeSize/2) +
                            ')');
            });
            
            graphics.link(function(link){
                return Viva.Graph.svg('path')
                           .attr('stroke', 'red')
                           .attr('stroke-dasharray', '5, 5');
            }).placeLink(function(linkUI, fromPos, toPos) {
                // linkUI - is the object returend from link() callback above.
                var data = 'M' + fromPos.x + ',' + fromPos.y +
                           'L' + toPos.x + ',' + toPos.y;
                // 'Path data' (http://www.w3.org/TR/SVG/paths.html#DAttribute )
                // is a common way of rendering paths in SVG:
                linkUI.attr("d", data);
            });



            }catch(ee){}  

            var renderer = Viva.Graph.View.renderer(graph, 
                {
              container : document.getElementById('network'),
                    graphics : graphics,
                    layout : layout
                });
            renderer.run();
                        

};









//put an interval to make sure we update page periodically.

// var interval = setInterval(function(){loadLatestData()}, 20000);
//loadLatestData();