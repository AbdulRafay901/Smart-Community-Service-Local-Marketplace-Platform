<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('role')->default('user'); // admin, user
            $table->string('profile_picture')->nullable();
            $table->text('bio')->nullable();
            $table->string('contact_info')->nullable();
            $table->string('location')->nullable();
            $table->text('skills_services')->nullable();
            $table->string('status')->default('active'); // active, suspended
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['role', 'profile_picture', 'bio', 'contact_info', 'location', 'skills_services', 'status']);
        });
    }
};
