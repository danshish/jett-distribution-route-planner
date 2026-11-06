package com.jett.valhalla

import com.osrm.api.models.RouteResponse as OsrmRouteResponse
import com.squareup.moshi.Moshi
import com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory
import com.valhalla.api.models.CostingModel
import com.valhalla.api.models.DirectionsOptions
import com.valhalla.api.models.RouteRequest
import com.valhalla.api.models.RoutingWaypoint
import com.valhalla.config.ValhallaConfigBuilder
import com.valhalla.valhalla.Valhalla
import com.valhalla.valhalla.ValhallaResponse
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File

class JettValhallaModule : Module() {
  private val moshi = Moshi.Builder().add(KotlinJsonAdapterFactory()).build()

  override fun definition() = ModuleDefinition {
    Name("JettValhalla")

    AsyncFunction("route") { archivePath: String, coordinates: List<Map<String, Double>> ->
      if (coordinates.size < 2) {
        throw IllegalArgumentException("At least two route points are required.")
      }
      // Expo FileSystem stores paths as file:// URIs. java.io.File(String) does not
      // resolve that scheme, so a valid 2.88 GB archive appears to be missing.
      val archive = if (archivePath.startsWith("file://")) {
        File(android.net.Uri.parse(archivePath).path
          ?: throw IllegalArgumentException("Invalid archive file URI."))
      } else {
        File(archivePath)
      }
      if (!archive.exists() || !archive.isFile || archive.length() < 2_500_000_000L) {
        throw IllegalArgumentException(
          "Valhalla archive inaccessible: exists=${archive.exists()}, " +
          "file=${archive.isFile}, bytes=${archive.length()}, path=${archive.absolutePath}"
        )
      }
      val waypoints = coordinates.mapIndexed { index, point ->
        val lat = point["lat"] ?: throw IllegalArgumentException("Route point $index has no latitude.")
        val lon = point["lon"] ?: throw IllegalArgumentException("Route point $index has no longitude.")
        if (!lat.isFinite() || !lon.isFinite() || lat < -90.0 || lat > 90.0 || lon < -180.0 || lon > 180.0) {
          throw IllegalArgumentException("Route point $index has invalid coordinates.")
        }
        RoutingWaypoint(lat = lat, lon = lon)
      }

      val config = ValhallaConfigBuilder()
        .withTileExtract(archive.absolutePath)
        .build()
      val engine = Valhalla(requireNotNull(appContext.reactContext), config)
      val request = RouteRequest(
        locations = waypoints,
        costing = CostingModel.auto,
        directionsOptions = DirectionsOptions(
          format = DirectionsOptions.Format.osrm,
          shapeFormat = DirectionsOptions.ShapeFormat.geojson,
        )
      )
      when (val response = engine.route(request)) {
        is ValhallaResponse.Osrm -> moshi.adapter(OsrmRouteResponse::class.java).toJson(response.osrmResponse)
        is ValhallaResponse.Json -> throw IllegalStateException("Valhalla returned an unexpected response format.")
      }
    }
  }
}
